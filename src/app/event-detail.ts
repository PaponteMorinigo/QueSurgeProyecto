import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { SaveButton } from './event-card';
import { EventCatalog, eventDate, eventTime, priceLabel } from './events';

@Component({
  imports: [IonContent, IonIcon, RouterLink, SaveButton],
  template: `
    <ion-content><div class="page">
      <a class="back-link" routerLink="/explorar"><ion-icon name="chevron-back" aria-hidden="true" /> Explorar</a>
      @if (event(); as item) {
        <div class="detail-photo"><img [src]="item.photo" alt=""><qs-save [id]="item.id" [title]="item.title" /></div>
        <div class="event-meta"><span class="tag">{{item.category}}</span><span>{{date.format(item.startsAt)}} · {{time.format(item.startsAt)}}</span></div>
        <h1>{{item.title}}</h1>
        <p class="intro">{{item.venue}} · {{item.city}}</p>
        <p>{{item.description}}</p>
        @if (item.sourceUrl; as source) {
          <p class="intro">Horario de Paraguay · Fuente {{item.sourceName || 'Ticketea'}}</p>
          <a class="action" [href]="source" target="_blank" rel="noopener noreferrer">Consultar en {{item.sourceName || 'Ticketea'}}</a>
        } @else {
          <strong class="price">{{price(item.price)}}</strong>
          @if (item.organizer) {
            <p>Organiza {{item.organizer}}</p>
            @for (ticket of item.tickets; track ticket.id) {
              <div class="ticket-summary"><span>{{ticket.name}}</span><strong>{{price(ticket.price)}}</strong></div>
            }
            <a class="action" [routerLink]="['/eventos',item.id,'entradas']">Comprar entradas</a>
          } @else { <p class="intro">Evento de demostración</p> }
        }
      } @else {
        <h1>Evento no encontrado</h1>
        <p class="intro">Explorá el catálogo para encontrar otros planes.</p>
      }
    </div></ion-content>
  `
})
export class EventDetailPage {
  private readonly catalog = inject(EventCatalog);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap);
  readonly event = computed(() => this.catalog.find(this.params()?.get('id') ?? null));
  readonly date = eventDate;
  readonly time = eventTime;
  readonly price = priceLabel;
}