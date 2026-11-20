import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Auth } from './auth';
import { CompanyStore } from './company-store';

@Component({
  imports: [IonContent, FormsModule],
  template: `
    <ion-content><div class="page"><h1>Validadores QR</h1><p class="intro">Creá accesos individuales para el personal del evento.</p>
      <form class="profile-form" (ngSubmit)="create()">
        <h2>Nuevo validador</h2>
        <label for="validator-name">Nombre</label><input id="validator-name" name="name" [(ngModel)]="name" required maxlength="80">
        <label for="validator-email">Correo electrónico</label><input id="validator-email" name="email" type="email" [(ngModel)]="email" required>
        <label for="validator-password">Contraseña inicial</label><input id="validator-password" name="password" type="password" [(ngModel)]="password" autocomplete="new-password" required minlength="8">
        <fieldset class="interest-fieldset"><legend>Eventos autorizados</legend>
          @for (event of store.own(); track event.id) {
            <label class="check-row"><input type="checkbox" [checked]="selected().includes(event.id)" (change)="toggle(event.id)">{{event.title}}</label>
          } @empty { <p>Creá un evento antes de asignar validadores.</p> }
        </fieldset>
        <button class="action" type="submit" [disabled]="busy()">{{busy() ? 'Guardando…' : 'Crear y asignar validador'}}</button>
        <p role="status" class="feedback">{{feedback()}}</p>
      </form>
      <h2 class="calendar-label">Personal asignado</h2>
      @for (validator of auth.validators(); track validator.id) {
        <article class="profile-form validator-card">
          <h2>{{validator.name}}</h2><p>{{validator.email}}</p>
          <span class="tag">{{validator.enabled ? 'Activo' : 'Desactivado'}}</span>
          @for (event of store.own(); track event.id) {
            <label class="check-row"><input type="checkbox" [checked]="validator.assignedEventIds.includes(event.id)"
              (change)="assign(validator.id, event.id)">{{event.title}}</label>
          }
          <button type="button" class="secondary-action" (click)="setEnabled(validator.id, !validator.enabled)">{{validator.enabled ? 'Desactivar acceso' : 'Activar acceso'}}</button>
        </article>
      } @empty { <p class="empty">Todavía no hay validadores asignados.</p> }
    </div></ion-content>
  `
})
export class ValidatorsPage {
  readonly auth = inject(Auth);
  readonly store = inject(CompanyStore);
  readonly selected = signal<string[]>([]);
  readonly busy = signal(false);
  readonly feedback = signal('');
  name = ''; email = ''; password = '';
  ionViewWillEnter() { this.store.refresh(); this.auth.refreshAccounts(); }
  toggle(id: string) { this.selected.update(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]); }
  async create() {
    if (this.busy()) return;
    this.busy.set(true);
    this.feedback.set('');
    try {
      if (!this.selected().length || this.selected().some(id => !this.store.find(id))) throw new Error('Elegí al menos un evento de tu empresa.');
      await this.auth.createValidator(this.name, this.email, this.password, this.selected());
      this.name = ''; this.email = ''; this.password = ''; this.selected.set([]);
      this.feedback.set('Validador creado. Puede ingresar con su correo y contraseña.');
    } catch (error) { this.feedback.set(error instanceof Error ? error.message : 'No se pudo crear el validador.'); }
    finally { this.busy.set(false); }
  }
  assign(id: string, eventId: string) {
    const validator = this.auth.validators().find(item => item.id === id);
    if (!validator) return;
    const assigned = validator.assignedEventIds.includes(eventId)
      ? validator.assignedEventIds.filter(item => item !== eventId) : [...validator.assignedEventIds, eventId];
    this.update(id, assigned, validator.enabled);
  }
  setEnabled(id: string, enabled: boolean) {
    const validator = this.auth.validators().find(item => item.id === id);
    if (validator) this.update(id, validator.assignedEventIds, enabled);
  }
  private update(id: string, events: string[], enabled: boolean) {
    try { this.auth.setValidator(id, events, enabled); this.feedback.set('Permisos guardados.'); }
    catch (error) { this.feedback.set(error instanceof Error ? error.message : 'No se pudieron guardar los permisos.'); }
  }
}
