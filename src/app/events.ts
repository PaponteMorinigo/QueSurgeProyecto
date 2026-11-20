import { computed, inject, Injectable, signal } from '@angular/core';

import { ExternalEvents } from './external-events';
import { CoverLibrary } from './cover-library';
import { Auth } from './auth';
import { paraguayEvents } from './paraguay-events';

import { Category } from './event-types';
import { CompanyStore, TicketType } from './company-store';
export { categories } from './event-types';
export type { Category } from './event-types';

export interface SurgeEvent {
  id: string;
  title: string;
  category: Category;
  startsAt: Date;
  venue: string;
  city: string;
  price: number | null;
  sourceUrl?: string;
  sourceName?: string;
  updatedAt?: string;
  photo: string;
  description: string;
  organizer?: string;
  tickets?: TicketType[];
}

export function dayKey(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}

export function eventDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en', {
    year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'America/Asuncion'
  }).formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export const eventDate = new Intl.DateTimeFormat('es-PY', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Asuncion' });
export const eventTime = new Intl.DateTimeFormat('es-PY', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Asuncion' });
const money = new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 });
export const amountLabel = (value: number) => money.format(value);
export const priceLabel = (price: number | null) => price === null ? 'Consultar entradas' : price === 0 ? 'Gratis' : money.format(price);

const placeKey = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();

const today = new Date();
function demoEvent(
  id: string, title: string, category: Category, offset: number, hour: number,
  venue: string, city: string, price: number, photo: string, description: string
): SurgeEvent {
  const startsAt = addDays(today, offset);
  startsAt.setHours(hour);
  return { id, title, category, startsAt, venue, city, price, photo: 'eventos/' + photo + '.jpg', description };
}

@Injectable({ providedIn: 'root' })
export class EventCatalog {
  readonly external = inject(ExternalEvents);
  readonly published = paraguayEvents;
  private readonly companies = inject(CompanyStore);
  private readonly covers = inject(CoverLibrary);
  private readonly auth = inject(Auth);
  readonly personalized = computed(() => {
    const preferences = this.auth.user()?.preferences;
    if (!preferences?.completed) return [];
    return this.events.filter(event => preferences.interests.includes(event.category) &&
      (preferences.city === 'Todo Paraguay' || placeKey(event.city) === placeKey(preferences.city)));
  });
  private readonly initialEvents = [
    ...this.published,
    demoEvent('pulso', 'Pulso al aire libre', 'Música', 1, 20, 'Costanera de Asunción', 'Asunción', 85000, 'pulso', 'Una noche al aire libre con artistas locales, DJ sets y un patio de comidas junto a la bahía.'),
    demoEvent('tinta', 'Tinta y ciudad', 'Arte', 3, 18, 'Centro Cultural Manzana de la Rivera', 'Asunción', 0, 'arte', 'Recorré una muestra de ilustración, fotografía y arte urbano con sus creadores.'),
    demoEvent('mesa', 'Mesa abierta', 'Gastronomía', 5, 19, 'Paseo La Galería', 'Asunción', 45000, 'mesa', 'Probá platos de cocineros locales y conocé los ingredientes detrás de cada receta.'),
    demoEvent('movimiento', 'Mañana en movimiento', 'Bienestar', 8, 8, 'Parque Ñu Guasu', 'Luque', 0, 'movimiento', 'Una sesión de movilidad y yoga al aire libre para todos los niveles.'),
    demoEvent('feria', 'Feria de barrio', 'Comunidad', 13, 16, 'Plaza Mariscal López', 'San Lorenzo', 0, 'feria', 'Emprendedores, música en vivo y talleres para compartir una tarde en la plaza.'),
    demoEvent('sesiones', 'Sesiones de medianoche', 'Música', 23, 22, 'Puerto de Asunción', 'Asunción', 120000, 'sesiones', 'Una selección de bandas emergentes y sesiones en vivo en el puerto.')
  ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  get events(): SurgeEvent[] {
    const local = this.companies.published().map(event => ({
      id: event.id, title: event.title, category: event.category, startsAt: new Date(event.startsAt),
      venue: event.venue, city: event.city, photo: this.covers.resolve(event.photo), description: event.description,
      price: Math.min(...event.tickets.map(ticket => ticket.price)), organizer: event.organizer, tickets: event.tickets
    }));
    const external = this.external.events().map(event => {
      const legacy = this.published.find(saved => saved.sourceUrl === event.sourceUrl ||
        (eventDayKey(saved.startsAt) === eventDayKey(event.startsAt) && placeKey(event.title).startsWith(placeKey(saved.title))));
      return legacy ? { ...event, id: legacy.id } : event;
    });
    const initial = this.external.updatedAt() ? this.initialEvents.filter(event => !event.sourceUrl) : this.initialEvents;
    return [...initial, ...external, ...local].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  find(id: string | null) {
    return this.events.find(event => event.id === id) ?? this.initialEvents.find(event => event.id === id);
  }
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}


@Injectable({ providedIn: 'root' })
export class Favorites {
  private readonly auth = inject(Auth);
  private readonly revision = signal(0);
  private readonly ids = computed(() => {
    this.revision();
    const key = this.storageKey();
    const saved = readLocal<unknown>(key, []);
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []);
  });
  readonly allIds = computed(() => [...this.ids()]);
  readonly count = computed(() => this.ids().size);

  private storageKey() {
    const user = this.auth.user();
    return user ? 'que-surge:favorites:' + user.id : 'que-surge:favorites';
  }

  has(id: string) { return this.ids().has(id); }

  toggle(id: string) {
    const next = new Set(this.ids());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (writeLocal(this.storageKey(), [...next])) this.revision.update(value => value + 1);
  }
}
