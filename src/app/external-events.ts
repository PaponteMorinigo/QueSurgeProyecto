import { Injectable, OnDestroy, signal } from '@angular/core';
import { categories } from './event-types';
import type { SurgeEvent } from './events';

const cacheKey = 'que-surge:external-agenda:v1';
interface Agenda { events: SurgeEvent[]; updatedAt: string | null; error?: string; refreshing?: boolean; }

function parse(value: unknown): Agenda {
  const data = value as Partial<Agenda> | null;
  const events = Array.isArray(data?.events) ? data.events.flatMap(event => {
    const date = new Date(event.startsAt);
    if (typeof event.id !== 'string' || !event.id.startsWith('ticketea-') ||
        typeof event.title !== 'string' || !categories.includes(event.category) ||
        !Number.isFinite(date.getTime()) || typeof event.city !== 'string' ||
        typeof event.venue !== 'string' || typeof event.photo !== 'string' ||
        !event.sourceUrl?.startsWith('https://ticketea.com.py/events/')) return [];
    return [{ ...event, startsAt: date }];
  }) : [];
  return { events, updatedAt: typeof data?.updatedAt === 'string' ? data.updatedAt : null, error: data?.error, refreshing: data?.refreshing };
}

function cached(): Agenda {
  try { return parse(JSON.parse(localStorage.getItem(cacheKey) ?? 'null')); }
  catch { return { events: [], updatedAt: null }; }
}

@Injectable({ providedIn: 'root' })
export class ExternalEvents implements OnDestroy {
  private readonly initial = cached();
  readonly events = signal(this.initial.events);
  readonly updatedAt = signal(this.initial.updatedAt);
  readonly online = signal(false);
  readonly status = signal('Consultando agenda externa…');
  private busy = false;
  private readonly timer = setInterval(() => { void this.refresh(); }, 60000);

  constructor() { void this.refresh(); }

  async refresh() {
    if (this.busy) return;
    this.busy = true;
    try {
      const response = await fetch('/api/events', { signal: AbortSignal.timeout(15000), cache: 'no-store' });
      if (!response.ok) throw new Error('Agenda no disponible');
      const data = parse(await response.json());
      if (!data.updatedAt) throw new Error(data.refreshing ? 'La primera importación está en curso.' : 'La agenda todavía no tiene una actualización.');
      this.events.set(data.events);
      this.updatedAt.set(data.updatedAt);
      this.online.set(!data.error);
      this.status.set(data.error ? 'La fuente no pudo actualizarse. Se conserva la última agenda.' :
        'Agenda externa actualizada · ' + new Intl.DateTimeFormat('es-PY', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(data.updatedAt)));
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    } catch {
      if (!this.updatedAt()) {
        try {
          const snapshot = await fetch('/agenda-inicial.json');
          if (snapshot.ok) {
            const saved = parse(await snapshot.json());
            if (saved.updatedAt) {
              this.events.set(saved.events);
              this.updatedAt.set(saved.updatedAt);
              try { localStorage.setItem(cacheKey, JSON.stringify(saved)); } catch {}
            }
          }
        } catch {}
      }
      this.online.set(false);
      this.status.set(this.updatedAt() ? 'Agenda externa sin conexión. Se muestra la última actualización.' : 'Agenda externa pendiente. Iniciá el servicio de eventos para actualizarla.');
    } finally { this.busy = false; }
  }
  ngOnDestroy() { clearInterval(this.timer); }
}
