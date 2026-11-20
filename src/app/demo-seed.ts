import { inject, Injectable, signal } from '@angular/core';
import { Auth } from './auth';
import { CompanyStore } from './company-store';
import { Commerce, Order, Ticket } from './commerce';
import { demoAccounts, demoBuyers, demoCompanies, demoEvents, demoPurchases } from './demo-fixtures';

function token(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}

@Injectable({ providedIn: 'root' })
export class DemoSeed {
  private readonly auth = inject(Auth);
  private readonly companies = inject(CompanyStore);
  readonly commerce = inject(Commerce);
  readonly ready = signal(false);
  readonly error = signal('');
  readonly companiesInfo = demoCompanies;
  readonly buyers = demoBuyers;
  private installing: Promise<void> | null = null;

  install(): Promise<void> {
    if (this.installing) return this.installing;
    this.error.set('');
    this.installing = this.populate().then(() => this.ready.set(true)).catch(error => {
      this.installing = null;
      this.error.set(error instanceof Error ? error.message : 'No se pudo completar la carga de ejemplos.');
      throw error;
    });
    return this.installing;
  }

  private async populate() {
    this.auth.addDemoAccounts(demoAccounts);
    const today = new Date();
    const events = demoEvents.map(({ days, hour, ...event }) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days, hour);
      return { ...event, startsAt: date.toISOString() };
    });
    const storedEvents = this.companies.addDemoEvents(events);
    const now = Date.now();
    const orders: Order[] = [];
    const tickets: Ticket[] = [];
    for (const [index, purchase] of demoPurchases.entries()) {
      const event = storedEvents.find(item => item.id === purchase.eventId)!;
      const buyer = demoBuyers.find(item => item.id === purchase.buyerId)!;
      const type = event.tickets.find(item => item.id === purchase.typeId)!;
      const validator = demoCompanies.find(company => company.id === event.ownerId)!.validatorId;
      const issued = Array.from({ length: purchase.quantity }, (_, ticketIndex): Ticket => ({
        id: 'qs-demo-v1-ticket-' + index + '-' + ticketIndex, orderId: purchase.id,
        companyId: event.ownerId, buyerId: buyer.id, eventId: event.id, eventTitle: event.title,
        venue: event.venue, city: event.city, startsAt: event.startsAt, typeId: type.id, typeName: type.name,
        price: type.price, token: token(),
        usedAt: ticketIndex < purchase.usedCount ? now - 600000 : null,
        validatedBy: ticketIndex < purchase.usedCount ? validator : null
      }));
      tickets.push(...issued);
      orders.push({
        id: purchase.id, companyId: event.ownerId, buyerId: buyer.id, buyerName: buyer.name,
        eventId: event.id, eventTitle: event.title, quantity: issued.length, total: type.price * issued.length,
        payment: 'Tarjeta de demostración', createdAt: now - (index + 1) * 3600000,
        ticketIds: issued.map(ticket => ticket.id)
      });
    }
    await this.commerce.addDemoRecords(orders, tickets);
  }

  openAccount(id: string) {
    if (!this.ready()) throw new Error('Esperá a que termine la carga de ejemplos.');
    this.auth.openDemoAccount(id);
  }
}
