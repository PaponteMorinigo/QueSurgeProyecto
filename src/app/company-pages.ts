import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonInput } from '@ionic/angular/standalone';
import { CoverLibrary } from './cover-library';
import { Commerce } from './commerce';
import { Auth } from './auth';
import { CompanyStore } from './company-store';
import { amountLabel, eventDate, eventTime, priceLabel } from './events';

@Component({
  imports: [IonContent, RouterLink],
  template: `
    <ion-content><div class="page">
      <header class="brand-header"><span class="brand">Qué <em>Surge.</em></span><span class="tag">Empresas</span></header>
      <h1>{{auth.user()?.companyName}}</h1><p class="intro">Tus eventos y su próximo gran momento.</p>
      <div class="business-stats">
        <article><strong>{{store.own().length}}</strong><span>Eventos creados</span></article>
        <article><strong>{{published()}}</strong><span>Publicados</span></article>
        <article><strong>{{store.own().length - published()}}</strong><span>Borradores</span></article>
      </div>
      <div class="business-stats">
        <article><strong>{{commerce.totals().quantity}}</strong><span>Entradas vendidas</span></article>
        <article><strong class="money-total">{{amount(commerce.totals().amount)}}</strong><span>Importe total</span></article>
        <article><strong>{{commerce.totals().used}}</strong><span>Accesos validados</span></article>
      </div>
      <p class="field-hint">Ventas de demostración registradas en este navegador.</p>
      <div class="row-actions"><a routerLink="/empresa/ventas">Ver ventas</a><a routerLink="/empresa/validadores">Gestionar validadores QR</a></div>
      <div class="business-banner"><div><h2>Hacé que suceda</h2><p>Creá tu evento, configurá las entradas y revisá la vista previa.</p></div><a class="action" routerLink="/empresa/eventos/nuevo">Crear evento</a></div>
      <div class="section-head"><h2>Mis eventos</h2><a routerLink="/empresa/eventos">Ver todos</a></div>
      @for (event of store.own().slice(-3).reverse(); track event.id) {
        <a class="business-row" [routerLink]="['/empresa/eventos', event.id, 'vista-previa']">
          <img [src]="covers.resolve(event.photo)" alt=""><div><h2>{{event.title}}</h2><p>{{date.format(newDate(event.startsAt))}} · {{event.city}}</p>
          <span class="tag">{{event.status === 'published' ? 'Publicado' : 'Borrador'}}</span></div>
        </a>
      } @empty { <div class="empty"><h2>Tu primer evento empieza acá</h2><p>Los eventos que crees aparecerán en este panel.</p></div> }
    </div></ion-content>
  `
})
export class CompanyDashboard {
  readonly auth = inject(Auth);
  readonly store = inject(CompanyStore);
  readonly covers = inject(CoverLibrary);
  ionViewWillEnter() { this.store.refresh(); void this.commerce.refresh().catch(() => {}); }
  readonly commerce = inject(Commerce);
  readonly amount = amountLabel;
  readonly published = computed(() => this.store.own().filter(event => event.status === 'published').length);
  readonly date = eventDate;
  readonly newDate = (value: string) => new Date(value);
}

@Component({
  imports: [IonContent, RouterLink],
  template: `
    <ion-content><div class="page">
      <div class="section-head"><h1>Mis eventos</h1><a class="action" routerLink="/empresa/eventos/nuevo">Crear evento</a></div>
      <p class="intro">Administrá la programación de tu empresa.</p>
      <div class="chips" aria-label="Estado de eventos">
        @for (item of filters; track item.value) {
          <button type="button" [attr.aria-pressed]="filter() === item.value" (click)="filter.set(item.value)">{{item.label}}</button>
        }
      </div>
      @for (event of filtered(); track event.id) {
        <article class="business-row"><img [src]="covers.resolve(event.photo)" alt="">
          <div class="business-row-body"><span class="tag">{{event.status === 'published' ? 'Publicado' : 'Borrador'}}</span>
            <h2>{{event.title}}</h2><p>{{date.format(newDate(event.startsAt))}} · {{event.city}}</p>
            <div class="row-actions"><a [routerLink]="['/empresa/eventos',event.id,'editar']">Editar</a>
              <a [routerLink]="['/empresa/eventos',event.id,'vista-previa']">Vista previa</a></div>
          </div>
        </article>
      } @empty { <div class="empty"><h2>No hay eventos en esta vista</h2><p>Creá un evento o cambiá el filtro de estado.</p></div> }
    </div></ion-content>
  `
})
export class CompanyEventsPage {
  readonly store = inject(CompanyStore);
  readonly covers = inject(CoverLibrary);
  ionViewWillEnter() { this.store.refresh(); }
  readonly filter = signal('all');
  readonly filters = [{ value: 'all', label: 'Todos' }, { value: 'draft', label: 'Borradores' }, { value: 'published', label: 'Publicados' }];
  readonly filtered = computed(() => this.store.own().filter(event => this.filter() === 'all' || event.status === this.filter()));
  readonly date = eventDate;
  readonly newDate = (value: string) => new Date(value);
}

@Component({
  imports: [IonContent, RouterLink],
  template: `
    <ion-content><div class="page">
      <a class="back-link" routerLink="/empresa/eventos">← Mis eventos</a>
      @if (event(); as item) {
        <div class="section-head"><h1>Vista previa</h1><span class="tag">{{item.status === 'published' ? 'Publicado' : 'Borrador'}}</span></div>
        <div class="detail-photo"><img [src]="covers.resolve(item.photo)" alt=""></div>
        <span class="tag">{{item.category}}</span><h2 class="preview-title">{{item.title}}</h2>
        <p>{{date.format(newDate(item.startsAt))}} · {{time.format(newDate(item.startsAt))}} · Horario de Paraguay</p>
        <p>{{item.venue}} · {{item.city}}</p><p class="event-description">{{item.description}}</p>
        <h2>Entradas</h2>
        @for (ticket of item.tickets; track ticket.id) {
          <div class="ticket-summary"><div><strong>{{ticket.name}}</strong><p>Cupo {{ticket.capacity}}</p></div><strong>{{price(ticket.price)}}</strong></div>
        }
        <p class="feedback" role="status">{{feedback()}}</p>
        <div class="row-actions">
          <a class="secondary-action" [routerLink]="['/empresa/eventos', item.id, 'editar']">Editar evento</a>
          <button class="action" type="button" (click)="changeStatus()">{{item.status === 'draft' ? 'Publicar evento' : 'Volver a borrador'}}</button>
        </div>
        <p class="field-hint">Al publicar, el evento aparece en el catálogo de personas de este navegador.</p>
      } @else { <h1>Evento no encontrado</h1><p>Revisá los eventos de tu empresa.</p> }
    </div></ion-content>
  `
})
export class CompanyPreviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CompanyStore);
  readonly covers = inject(CoverLibrary);
  private readonly params = toSignal(this.route.paramMap);
  readonly event = computed(() => this.store.find(this.params()?.get('id') ?? null));
  readonly feedback = signal('');
  readonly date = eventDate;
  readonly time = eventTime;
  readonly price = priceLabel;
  readonly newDate = (value: string) => new Date(value);

  ionViewWillEnter() { this.store.refresh(); this.feedback.set(''); }
  changeStatus() {
    const event = this.event();
    if (!event) return;
    try {
      this.store.setStatus(event.id, event.status === 'draft' ? 'published' : 'draft', event.version);
      this.feedback.set(event.status === 'draft' ? 'Evento publicado.' : 'Evento guardado como borrador.');
    } catch (error) { this.feedback.set(error instanceof Error ? error.message : 'No se pudo actualizar el evento.'); }
  }
}

@Component({
  imports: [IonContent, RouterLink],
  template: `
    <ion-content><div class="page"><h1>Ventas y accesos</h1><p class="intro">Entradas emitidas por tu empresa.</p>
      <div class="business-stats">
        <article><strong>{{commerce.totals().quantity}}</strong><span>Total de entradas vendidas</span></article>
        <article><strong class="money-total">{{amount(commerce.totals().amount)}}</strong><span>Monto total</span></article>
        <article><strong>{{commerce.totals().used}}</strong><span>Entradas utilizadas</span></article>
      </div>
      <p class="field-hint">Importes de compras de demostración. Las lecturas QR quedan registradas.</p>
      <div class="row-actions"><a class="action" routerLink="/empresa/validadores">Asignar validadores QR</a><button class="secondary-action" type="button" (click)="refresh()">Actualizar ventas</button></div>
      <p class="form-error" role="alert">{{commerce.error()}}</p>
      @for (order of commerce.sales().slice().reverse(); track order.id) {
        <article class="business-row"><div><h2>{{order.eventTitle}}</h2>
          <p>{{order.buyerName}} · {{order.quantity}} entradas · {{date(order.createdAt)}}</p><strong>{{amount(order.total)}}</strong>
        </div></article>
      } @empty {
        <div class="empty"><h2>Todavía no hay ventas</h2><p>Las compras de tus eventos aparecerán en este apartado.</p></div>
      }
    </div></ion-content>
  `
})
export class CompanySalesPage {
  readonly commerce = inject(Commerce);
  readonly amount = amountLabel;
  readonly date = (value: number) => new Intl.DateTimeFormat('es-PY', { dateStyle: 'short', timeStyle: 'short' }).format(value);
  ionViewWillEnter() { this.refresh(); }
  refresh() { void this.commerce.refresh().catch(() => this.commerce.error.set('No se pudieron actualizar las ventas.')); }
}

@Component({
  imports: [IonContent, IonInput, FormsModule],
  template: `
    <ion-content><div class="page"><h1>Mi empresa</h1>
      <p class="intro">{{auth.user()?.email}}</p>
      <form class="profile-form" (ngSubmit)="save()">
        <ion-input name="companyName" label="Nombre de la empresa" labelPlacement="stacked" fill="outline" [(ngModel)]="companyName" [maxlength]="100" />
        <ion-input name="contactName" label="Persona de contacto" labelPlacement="stacked" fill="outline" [(ngModel)]="name" [maxlength]="80" />
        <button type="submit" class="action">Guardar datos</button>
        <p role="status" class="feedback">{{feedback()}}</p>
      </form>
      <p class="field-hint">Cuenta empresarial de demostración en este navegador.</p>
      <button type="button" class="secondary-action" (click)="logout()">Cerrar sesión</button>
    </div></ion-content>
  `
})
export class CompanyProfilePage {
  readonly auth = inject(Auth);
  private readonly router = inject(Router);
  readonly feedback = signal('');
  name = '';
  companyName = '';
  ionViewWillEnter() {
    this.name = this.auth.user()?.name ?? '';
    this.companyName = this.auth.user()?.companyName ?? '';
    this.feedback.set('');
  }
  save() {
    try { this.auth.updateCompany(this.name, this.companyName); this.feedback.set('Datos guardados.'); }
    catch (error) { this.feedback.set(error instanceof Error ? error.message : 'No se pudieron guardar los datos.'); }
  }
  async logout() {
    try { this.auth.logout(); await this.router.navigateByUrl('/ingresar'); }
    catch { this.feedback.set('No se pudo cerrar la sesión. Intentá nuevamente.'); }
  }
}
