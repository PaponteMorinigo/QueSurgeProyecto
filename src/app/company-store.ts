import { computed, inject, Injectable, signal } from '@angular/core';
import { CoverLibrary } from './cover-library';
import { Auth } from './auth';
import { categories, Category } from './event-types';

export interface TicketType { id: string; name: string; price: number; capacity: number; }
export interface CompanyEventInput {
  title: string;
  description: string;
  category: Category;
  startsAt: string;
  venue: string;
  city: string;
  photo: string;
  tickets: TicketType[];
}
export interface CompanyEvent extends CompanyEventInput {
  id: string;
  ownerId: string;
  organizer: string;
  status: 'draft' | 'published';
  version: number;
}
export const eventPhotos = [
  { path: 'eventos/pulso.jpg', label: 'Concierto' },
  { path: 'eventos/arte.jpg', label: 'Arte' },
  { path: 'eventos/mesa.jpg', label: 'Gastronomía' },
  { path: 'eventos/movimiento.jpg', label: 'Bienestar' },
  { path: 'eventos/feria.jpg', label: 'Feria' },
  { path: 'eventos/sesiones.jpg', label: 'Música en vivo' }
];
const storageKey = 'que-surge:company-events:v1';

function loadEvents(): CompanyEvent[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((event: CompanyEvent) =>
      event && typeof event.id === 'string' && typeof event.ownerId === 'string' &&
      typeof event.organizer === 'string' && typeof event.title === 'string' &&
      typeof event.description === 'string' && categories.includes(event.category) &&
      Number.isFinite(Date.parse(event.startsAt)) && typeof event.venue === 'string' &&
      typeof event.city === 'string' && (eventPhotos.some(photo => photo.path === event.photo) || (typeof event.photo === 'string' && /^cover:[0-9a-f-]{36}$/.test(event.photo))) &&
      ['draft', 'published'].includes(event.status) && Number.isInteger(event.version) &&
      Array.isArray(event.tickets) && event.tickets.length > 0 &&
      event.tickets.every(ticket => ticket && typeof ticket.id === 'string' &&
        typeof ticket.name === 'string' && Number.isSafeInteger(ticket.price) && ticket.price >= 0 &&
        Number.isSafeInteger(ticket.capacity) && ticket.capacity > 0));
  } catch { return []; }
}

@Injectable({ providedIn: 'root' })
export class CompanyStore {
  private readonly auth = inject(Auth);
  private readonly covers = inject(CoverLibrary);
  private readonly records = signal(loadEvents());
  readonly own = computed(() => {
    const user = this.auth.user();
    return user?.role === 'company' ? this.records().filter(event => event.ownerId === user.id) : [];
  });
  readonly published = computed(() => this.records().filter(event => event.status === 'published'));

  readonly assigned = computed(() => {
    const user = this.auth.user();
    return user?.role === 'validator' ? this.records().filter(event =>
      event.ownerId === user.companyId && user.assignedEventIds.includes(event.id)) : [];
  });

  addDemoEvents(events: CompanyEvent[]) {
    const current = loadEvents();
    for (const event of events) {
      if (!event.id.startsWith('qs-demo-v1-') || !event.ownerId.startsWith('qs-demo-v1-')) throw new Error('Evento de ejemplo inválido.');
      if (!current.some(item => item.id === event.id)) current.push(event);
    }
    this.persist(current);
    return events.map(event => current.find(item => item.id === event.id)!);
  }

  refresh() { this.records.set(loadEvents()); }

  private owner() {
    const user = this.auth.user();
    if (user?.role !== 'company') throw new Error('Ingresá con una cuenta de empresa.');
    return user;
  }

  find(id: string | null) { return this.own().find(event => event.id === id); }

  private persist(records: CompanyEvent[]) {
    try { localStorage.setItem(storageKey, JSON.stringify(records)); }
    catch { throw new Error('No se pudo guardar. Revisá el espacio disponible en este navegador.'); }
    this.records.set(records);
  }

  save(input: CompanyEventInput, id: string | null, expectedVersion: number): CompanyEvent {
    const user = this.owner();
    const fresh = loadEvents();
    const previous = id ? fresh.find(event => event.id === id && event.ownerId === user.id) : undefined;
    if (id && !previous) throw new Error('No se encontró el evento de tu empresa.');
    if (previous && previous.version !== expectedVersion) throw new Error('El evento cambió en otra ventana. Volvé a abrirlo para editar.');
    if (!input.title.trim() || input.title.trim().length > 100) throw new Error('Ingresá un título de hasta 100 caracteres.');
    if (input.description.trim().length < 20 || input.description.length > 4000) throw new Error('La descripción debe tener entre 20 y 4000 caracteres.');
    if (!categories.includes(input.category)) throw new Error('Elegí una categoría válida.');
    if (!Number.isFinite(Date.parse(input.startsAt)) || Date.parse(input.startsAt) <= Date.now()) throw new Error('Elegí una fecha y hora futuras.');
    if (!input.venue.trim() || !input.city.trim() || input.venue.length > 160 || input.city.length > 80) throw new Error('Ingresá un lugar y una ciudad válidos.');
    if (!eventPhotos.some(photo => photo.path === input.photo) && !this.covers.hasOwned(input.photo, user.id)) throw new Error('Elegí una foto de portada.');
    if (!input.tickets.length || input.tickets.length > 10) throw new Error('Agregá entre 1 y 10 tipos de entrada.');
    for (const ticket of input.tickets) {
      if (!ticket.name.trim() || ticket.name.length > 60 || !Number.isSafeInteger(ticket.price) || ticket.price < 0 ||
          !Number.isSafeInteger(ticket.capacity) || ticket.capacity < 1 || ticket.capacity > 1000000) {
        throw new Error('Cada entrada necesita nombre, precio entero desde 0 y cupo entero entre 1 y 1.000.000.');
      }
    }
    if (new Set(input.tickets.map(ticket => ticket.name.trim().toLowerCase())).size !== input.tickets.length) {
      throw new Error('Usá nombres distintos para los tipos de entrada.');
    }
    const event: CompanyEvent = {
      ...input, title: input.title.trim(), description: input.description.trim(),
      venue: input.venue.trim(), city: input.city.trim(),
      tickets: input.tickets.map(ticket => ({ ...ticket, name: ticket.name.trim() })),
      id: previous?.id ?? 'empresa-' + crypto.randomUUID(), ownerId: user.id,
      organizer: user.companyName, status: previous?.status ?? 'draft', version: (previous?.version ?? 0) + 1
    };
    this.persist([...fresh.filter(item => item.id !== event.id), event]);
    return event;
  }

  setStatus(id: string, status: 'draft' | 'published', expectedVersion: number) {
    const user = this.owner();
    const records = loadEvents();
    const event = records.find(item => item.id === id && item.ownerId === user.id);
    if (!event) throw new Error('No se encontró el evento de tu empresa.');
    if (event.version !== expectedVersion) throw new Error('El evento cambió. Volvé a abrir la vista previa.');
    if (status === 'published' && Date.parse(event.startsAt) <= Date.now()) throw new Error('Actualizá la fecha antes de publicar.');
    this.persist(records.map(item => item.id === id ? { ...item, status, version: item.version + 1 } : item));
  }
}
