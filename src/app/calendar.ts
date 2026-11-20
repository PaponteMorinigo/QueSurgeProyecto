import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { EventCard } from './event-card';
import { addDays, dayKey, eventDayKey, EventCatalog, eventDate } from './events';

const modes = ['Mes', 'Semana', 'Lista'] as const;
const monthLabel = new Intl.DateTimeFormat('es-PY', { month: 'long', year: 'numeric' });
const fullDate = new Intl.DateTimeFormat('es-PY', { dateStyle: 'full' });

function weekStart(date: Date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

@Component({
  imports: [IonContent, IonIcon, EventCard, RouterLink],
  template: `
    <ion-content><div class="page">
      <h1>Calendario</h1>
      <p class="intro">Elegí una fecha para ver qué hay.</p>
      <div class="chips modes" aria-label="Vista del calendario">
        @for (item of modes; track item) {
          <button type="button" [attr.aria-pressed]="mode() === item" (click)="mode.set(item)">{{item}}</button>
        }
      </div>
      @if (mode() !== 'Lista') {
        <section class="calendar" aria-label="Selector de fechas">
          <div class="calendar-head">
            <button type="button" aria-label="Período anterior" (click)="move(-1)"><ion-icon name="chevron-back" aria-hidden="true" /></button>
            <h2 aria-live="polite">{{period()}}</h2>
            <button type="button" aria-label="Período siguiente" (click)="move(1)"><ion-icon name="chevron-forward" aria-hidden="true" /></button>
          </div>
          <div class="calendar-grid">
            @for (label of weekdays; track label) { <span class="weekday" aria-hidden="true">{{label}}</span> }
            @for (date of dates(); track key(date)) {
              <button type="button" [class.outside]="mode() === 'Mes' && date.getMonth() !== selected().getMonth()"
                [attr.aria-label]="describe(date)" [attr.aria-pressed]="key(date) === key(selected())"
                [attr.aria-current]="key(date) === key(today) ? 'date' : null" (click)="selected.set(date)">
                {{date.getDate()}} @if (hasEvents(date)) { <span class="dot" aria-hidden="true"></span> }
              </button>
            }
          </div>
          <button type="button" class="today-button" (click)="selected.set(today)">Volver a hoy</button>
        </section>
        <h2 class="calendar-label">{{dateLabel.format(selected())}}</h2>
        @if (!selectedEvents().length) { <p class="empty">No hay eventos para este día.</p> }
        <div class="event-grid">
          @for (event of selectedEvents(); track event.id) { <qs-event-card [event]="event" /> }
        </div>
      } @else {
        @for (group of groups(); track key(group.date)) {
          <section class="calendar-group">
            <h2 class="calendar-label">{{dateLabel.format(group.date)}}</h2>
            <div class="event-grid">
              @for (event of group.events; track event.id) { <qs-event-card [event]="event" /> }
            </div>
          </section>
        } @empty {
          <div class="empty"><p>No hay eventos que coincidan con tus preferencias.</p><a class="action" routerLink="/gustos">Cambiar preferencias</a></div>
        }
      }
    </div></ion-content>
  `
})
export class CalendarPage {
  readonly today = new Date();
  readonly selected = signal(this.today);
  readonly mode = signal<typeof modes[number]>('Mes');
  readonly modes = modes;
  readonly weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly key = dayKey;
  readonly dateLabel = eventDate;
  private readonly catalog = inject(EventCatalog);
  private readonly byDay = computed(() => this.catalog.personalized().reduce((days, event) => {
    const key = eventDayKey(event.startsAt);
    days.set(key, [...(days.get(key) ?? []), event]);
    return days;
  }, new Map<string, EventCatalog['events']>()));
  readonly groups = computed(() => Array.from(this.byDay().values(), events => ({ date: events[0].startsAt, events })));
  readonly selectedEvents = computed(() => this.byDay().get(dayKey(this.selected())) ?? []);
  readonly dates = computed(() => {
    const selected = this.selected();
    if (this.mode() === 'Semana') {
      const start = weekStart(selected);
      return Array.from({ length: 7 }, (_, index) => addDays(start, index));
    }
    const start = weekStart(new Date(selected.getFullYear(), selected.getMonth(), 1));
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  });
  readonly period = computed(() => {
    if (this.mode() === 'Mes') return monthLabel.format(this.selected());
    const start = weekStart(this.selected());
    return eventDate.formatRange(start, addDays(start, 6));
  });

  hasEvents(date: Date) { return this.byDay().has(dayKey(date)); }

  describe(date: Date) {
    return fullDate.format(date) + (this.hasEvents(date) ? ', con eventos' : '');
  }

  move(step: number) {
    const current = this.selected();
    if (this.mode() === 'Semana') {
      this.selected.set(addDays(current, step * 7));
      return;
    }
    const next = new Date(current.getFullYear(), current.getMonth() + step, 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(current.getDate(), lastDay));
    this.selected.set(next);
  }
}