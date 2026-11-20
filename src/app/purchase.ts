import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { CompanyStore } from './company-store';
import { Commerce } from './commerce';
import { priceLabel } from './events';

@Component({
  imports: [IonContent, FormsModule, RouterLink],
  template: `
    <ion-content><div class="page access-page">
      <h1>Comprar entradas</h1>
      @if (event(); as item) {
        <h2>{{item.title}}</h2><p class="intro">{{item.venue}} · {{item.city}}</p>
        <form class="profile-form" (ngSubmit)="buy()">
          <label for="ticket-type">Tipo de entrada</label>
          <select id="ticket-type" name="type" [(ngModel)]="typeId">
            @for (ticket of item.tickets; track ticket.id) {
              <option [value]="ticket.id">{{ticket.name}} · {{price(ticket.price)}} · {{commerce.available(item.id, ticket.id, ticket.capacity)}} disponibles</option>
            }
          </select>
          <label for="ticket-quantity">Cantidad</label>
          <input id="ticket-quantity" name="quantity" type="number" min="1" step="1" [(ngModel)]="quantity" required>
          <label for="payment-method">Medio de pago</label>
          <select id="payment-method" name="payment" [(ngModel)]="payment">
            <option>Tarjeta de demostración</option><option>Transferencia de demostración</option>
          </select>
          <p>Total <strong>{{price(total())}}</strong></p>
          <p class="field-hint">Compra de demostración en este navegador. Se generará un QR único por entrada.</p>
          <button type="submit" class="action wide" [disabled]="busy()">{{busy() ? 'Guardando compra…' : 'Confirmar compra de demostración'}}</button>
          <p class="form-error" role="alert">{{error()}}</p>
        </form>
      } @else { <div class="empty"><p>El evento no está disponible para comprar entradas.</p><a routerLink="/inicio">Volver a Inicio</a></div> }
    </div></ion-content>
  `
})
export class PurchasePage {
  private readonly companies = inject(CompanyStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly commerce = inject(Commerce);
  readonly event = computed(() => this.companies.published().find(item => item.id === this.route.snapshot.paramMap.get('id')));
  readonly price = priceLabel;
  readonly busy = signal(false);
  readonly error = signal('');
  typeId = '';
  quantity = 1;
  payment = 'Tarjeta de demostración';
  private requestId = crypto.randomUUID();
  total() { return (this.event()?.tickets.find(ticket => ticket.id === this.typeId)?.price ?? 0) * this.quantity; }

  ionViewWillEnter() {
    this.companies.refresh();
    this.typeId = this.event()?.tickets[0]?.id ?? '';
    this.quantity = 1;
    this.error.set('');
    this.requestId = crypto.randomUUID();
    void this.commerce.refresh().catch(() => this.error.set('No se pudo consultar la disponibilidad.'));
  }
  async buy() {
    if (this.busy()) return;
    const event = this.event();
    if (!event) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.commerce.purchase(event.id, this.typeId, this.quantity, this.payment, this.requestId);
      await this.router.navigateByUrl('/entradas');
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'No se pudo completar la compra.'); }
    finally { this.busy.set(false); }
  }
}
