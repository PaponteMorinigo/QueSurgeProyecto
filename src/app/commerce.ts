import { computed, inject, Injectable, signal } from '@angular/core';
import { Auth } from './auth';
import { CompanyStore } from './company-store';

export interface Ticket {
  id: string; orderId: string; companyId: string; buyerId: string;
  eventId: string; eventTitle: string; venue: string; city: string; startsAt: string;
  typeId: string; typeName: string; price: number; token: string;
  usedAt: number | null; validatedBy: string | null;
}
export interface Order {
  id: string; companyId: string; buyerId: string; buyerName: string;
  eventId: string; eventTitle: string; quantity: number; total: number;
  payment: string; createdAt: number; ticketIds: string[];
}
export const ticketCode = (ticket: Ticket) => ['QS1', ticket.id, ticket.token].join('.');

@Injectable({ providedIn: 'root' })
export class Commerce {
  private readonly auth = inject(Auth);
  private readonly companies = inject(CompanyStore);
  private database: Promise<IDBDatabase> | null = null;
  private readonly tickets = signal<Ticket[]>([]);
  private readonly orders = signal<Order[]>([]);
  readonly error = signal('');
  readonly ready = this.refresh().catch(() => this.error.set('No se pudieron recuperar las entradas de este navegador.'));
  readonly mine = computed(() => this.tickets().filter(ticket => ticket.buyerId === this.auth.user()?.id));
  readonly sales = computed(() => this.orders().filter(order => order.companyId === this.auth.user()?.id));
  readonly totals = computed(() => ({
    quantity: this.sales().reduce((total, order) => total + order.quantity, 0),
    amount: this.sales().reduce((total, order) => total + order.total, 0),
    used: this.tickets().filter(ticket => ticket.companyId === this.auth.user()?.id && ticket.usedAt).length
  }));
  readonly scans = computed(() => this.tickets().filter(ticket => ticket.validatedBy === this.auth.user()?.id));

  private open(): Promise<IDBDatabase> {
    if (!this.database) {
      this.database = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('que-surge-commerce', 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('tickets', { keyPath: 'id' });
          request.result.createObjectStore('orders', { keyPath: 'id' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Cerrá las otras pestañas e intentá nuevamente.'));
      }).catch(error => { this.database = null; throw error; });
    }
    return this.database;
  }

  async refresh() {
    const database = await this.open();
    const result = await new Promise<{ tickets: Ticket[]; orders: Order[] }>((resolve, reject) => {
      const transaction = database.transaction(['tickets', 'orders']);
      const tickets = transaction.objectStore('tickets').getAll();
      const orders = transaction.objectStore('orders').getAll();
      transaction.oncomplete = () => resolve({ tickets: tickets.result, orders: orders.result });
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
    });
    this.tickets.set(result.tickets);
    this.orders.set(result.orders);
    this.error.set('');
  }

  available(eventId: string, typeId: string, capacity: number) {
    return Math.max(0, capacity - this.tickets().filter(ticket => ticket.eventId === eventId && ticket.typeId === typeId).length);
  }

  demoTotals(companyId: string) {
    const orders = this.orders().filter(order => order.companyId === companyId);
    return {
      quantity: orders.reduce((sum, order) => sum + order.quantity, 0),
      amount: orders.reduce((sum, order) => sum + order.total, 0),
      used: this.tickets().filter(ticket => ticket.companyId === companyId && ticket.usedAt).length
    };
  }

  async addDemoRecords(orders: Order[], tickets: Ticket[]) {
    if ([...orders, ...tickets].some(record => !record.id.startsWith('qs-demo-v1-'))) throw new Error('Datos de ejemplo inválidos.');
    await this.ready;
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(['orders', 'tickets'], 'readwrite');
      const orderStore = transaction.objectStore('orders');
      const ticketStore = transaction.objectStore('tickets');
      const existingOrders = orderStore.getAllKeys();
      existingOrders.onsuccess = () => {
        const existingTickets = ticketStore.getAllKeys();
        existingTickets.onsuccess = () => {
          const orderIds = new Set(existingOrders.result);
          const ticketIds = new Set(existingTickets.result);
          orders.filter(order => !orderIds.has(order.id)).forEach(order => orderStore.add(order));
          tickets.filter(ticket => !ticketIds.has(ticket.id)).forEach(ticket => ticketStore.add(ticket));
        };
      };
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(new Error('No se pudieron guardar las compras de ejemplo. Podés reintentar la carga.'));
      transaction.onerror = () => reject(transaction.error);
    });
    await this.refresh();
  }

  async purchase(eventId: string, typeId: string, quantity: number, payment: string, requestId: string): Promise<Order> {
    await this.ready;
    const buyer = this.auth.user();
    if (buyer?.role !== 'person' || this.auth.needsPreferences()) throw new Error('Ingresá y completá tus preferencias.');
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Ingresá una cantidad entera de entradas.');
    if (!['Tarjeta de demostración', 'Transferencia de demostración'].includes(payment)) throw new Error('Elegí un medio de pago.');
    this.companies.refresh();
    const event = this.companies.published().find(item => item.id === eventId);
    const type = event?.tickets.find(item => item.id === typeId);
    if (!event || !type || Date.parse(event.startsAt) <= Date.now()) throw new Error('Estas entradas ya no están disponibles.');
    if (!Number.isSafeInteger(type.price * quantity)) throw new Error('El importe solicitado es demasiado alto.');
    const database = await this.open();
    const order = await new Promise<Order>((resolve, reject) => {
      const transaction = database.transaction(['orders', 'tickets'], 'readwrite');
      const orders = transaction.objectStore('orders');
      const tickets = transaction.objectStore('tickets');
      let completed: Order;
      const existing = orders.get(requestId);
      existing.onsuccess = () => {
        if (existing.result) {
          if (existing.result.buyerId !== buyer.id) { reject(new Error('La solicitud pertenece a otra cuenta.')); return; }
          completed = existing.result;
          return;
        }
        const stock = tickets.getAll();
        stock.onsuccess = () => {
          const sold = (stock.result as Ticket[]).filter(ticket => ticket.eventId === event.id && ticket.typeId === type.id).length;
          if (quantity > type.capacity - sold) { reject(new Error('No queda cupo suficiente. Elegí una cantidad menor.')); return; }
          const issued: Ticket[] = Array.from({ length: quantity }, () => ({
            id: crypto.randomUUID(), orderId: requestId, companyId: event.ownerId, buyerId: buyer.id,
            eventId, eventTitle: event.title, venue: event.venue, city: event.city, startsAt: event.startsAt,
            typeId, typeName: type.name, price: type.price, token: crypto.randomUUID(), usedAt: null, validatedBy: null
          }));
          completed = {
            id: requestId, companyId: event.ownerId, buyerId: buyer.id, buyerName: buyer.name,
            eventId, eventTitle: event.title, quantity, total: type.price * quantity,
            payment, createdAt: Date.now(), ticketIds: issued.map(ticket => ticket.id)
          };
          issued.forEach(ticket => tickets.add(ticket));
          orders.add(completed);
        };
      };
      transaction.oncomplete = () => { if (completed) resolve(completed); };
      transaction.onabort = () => reject(new Error('No se pudo guardar la compra. Intentá nuevamente.'));
      transaction.onerror = () => reject(transaction.error);
    });
    await this.refresh().catch(() => this.error.set('La compra fue guardada. Recargá para actualizar la lista.'));
    return order;
  }

  async validate(code: string, eventId: string): Promise<Ticket> {
    const reader = this.auth.currentAccount();
    if (reader?.role !== 'validator' || !reader.enabled || !reader.assignedEventIds.includes(eventId)) {
      throw new Error('No tenés autorización para validar este evento.');
    }
    const parts = code.trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'QS1') throw new Error('El QR no es una entrada de Qué Surge.');
    const database = await this.open();
    const result = await new Promise<Ticket>((resolve, reject) => {
      const transaction = database.transaction('tickets', 'readwrite');
      const store = transaction.objectStore('tickets');
      let accepted: Ticket;
      const request = store.get(parts[1]);
      request.onsuccess = () => {
        const ticket = request.result as Ticket | undefined;
        if (!ticket || ticket.token !== parts[2]) { reject(new Error('La entrada no existe o el QR es inválido.')); return; }
        if (ticket.eventId !== eventId || ticket.companyId !== reader.companyId) { reject(new Error('Esta entrada corresponde a otro evento.')); return; }
        if (ticket.usedAt) { reject(new Error('Entrada ya utilizada. No se permite un segundo ingreso.')); return; }
        accepted = { ...ticket, usedAt: Date.now(), validatedBy: reader.id };
        store.put(accepted);
      };
      transaction.oncomplete = () => { if (accepted) resolve(accepted); };
      transaction.onabort = () => reject(new Error('No se pudo registrar la lectura. Intentá nuevamente.'));
      transaction.onerror = () => reject(transaction.error);
    });
    await this.refresh().catch(() => this.error.set('La lectura fue registrada. Recargá para ver el historial.'));
    return result;
  }
}
