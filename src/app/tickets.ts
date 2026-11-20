import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { toDataURL } from 'qrcode';
import { Commerce, Ticket, ticketCode } from './commerce';
import { eventDate, eventTime } from './events';

@Component({
  selector: 'qs-ticket',
  template: `
    <article class="ticket-card">
      <h2>{{ticket().eventTitle}}</h2><p>{{ticket().venue}} · {{ticket().city}}</p>
      <p>{{date.format(newDate(ticket().startsAt))}} · {{time.format(newDate(ticket().startsAt))}}</p>
      <span class="tag">{{ticket().typeName}} · {{ticket().usedAt ? 'Utilizada' : 'Disponible'}}</span>
      @if (qr()) { <img class="ticket-qr" [src]="qr()" alt="Código QR de tu entrada"> }
      <p class="field-hint">Presentá este QR en el acceso. Cada entrada permite una validación.</p>
      <details><summary>Ver código de la entrada</summary><code class="ticket-code">{{code(ticket())}}</code></details>
      <p class="form-error" role="alert">{{error()}}</p>
    </article>
  `
})
export class TicketCard {
  readonly ticket = input.required<Ticket>();
  readonly qr = signal('');
  readonly error = signal('');
  readonly code = ticketCode;
  readonly date = eventDate;
  readonly time = eventTime;
  readonly newDate = (value: string) => new Date(value);
  constructor() {
    effect(onCleanup => {
      let active = true;
      const code = ticketCode(this.ticket());
      void toDataURL(code, { width: 280, margin: 4, errorCorrectionLevel: 'M' })
        .then(url => { if (active) this.qr.set(url); })
        .catch(() => { if (active) this.error.set('No se pudo mostrar el QR. Usá el código de la entrada.'); });
      onCleanup(() => { active = false; });
    });
  }
}

@Component({
  imports: [IonContent, RouterLink, TicketCard],
  template: `
    <ion-content><div class="page"><h1>Mis tickets</h1><p class="intro">Tus entradas y códigos de acceso.</p>
      <p class="form-error" role="alert">{{commerce.error()}}</p>
      <div class="event-grid">
        @for (ticket of commerce.mine(); track ticket.id) { <qs-ticket [ticket]="ticket" /> }
      </div>
      @if (!commerce.mine().length) {
        <div class="empty"><h2>Todavía no tenés entradas</h2><p>Encontrá un evento para tu próximo plan.</p>
          <a class="action" routerLink="/explorar">Explorar eventos</a></div>
      }
    </div></ion-content>
  `
})
export class TicketsPage {
  readonly commerce = inject(Commerce);
  ionViewWillEnter() { void this.commerce.refresh().catch(() => {}); }
}
