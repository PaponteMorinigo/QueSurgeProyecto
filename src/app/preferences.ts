import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { Auth } from './auth';
import { categories } from './events';

export const cities = ['Asunción', 'Encarnación', 'Caaguazú', 'Luque', 'San Lorenzo', 'Ciudad del Este', 'Todo Paraguay'];

@Component({
  imports: [FormsModule, IonContent],
  template: `
    <ion-content><div class="page access-page">
      <span class="brand">Qué <em>Surge.</em></span>
      <div class="access-heading">
        <h1>¿Qué te mueve?</h1>
        <p class="intro">Elegí tus gustos y tu ciudad para ver eventos que coincidan con vos.</p>
      </div>
      <form class="profile-form" (ngSubmit)="save()">
        <fieldset class="interest-fieldset"><legend>Tus intereses</legend>
          <p class="field-hint">Elegí uno o varios. Podés cambiarlos cuando quieras.</p>
          <div class="chips">
            @for (category of categories; track category) {
              <button type="button" [attr.aria-pressed]="selected().includes(category)" (click)="toggle(category)">{{category}}</button>
            }
          </div>
        </fieldset>
        <label class="city-label" for="city">¿Dónde buscás planes?</label>
        <select id="city" name="city" [(ngModel)]="city" (ngModelChange)="error.set('')">
          <option value="">Elegí una ciudad</option>
          @for (item of cities; track item) { <option [value]="item">{{item}}</option> }
        </select>
        <p role="alert" class="form-error">{{error()}}</p>
        <button type="submit" class="action wide">Ver eventos para mí</button>
        <button type="button" class="text-button" (click)="logout()">Cerrar sesión</button>
      </form>
    </div></ion-content>
  `
})
export class PreferencesPage {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  readonly categories = categories;
  readonly cities = cities;
  readonly selected = signal(this.auth.user()?.preferences.interests ?? []);
  city = this.auth.user()?.preferences.city ?? '';
  readonly error = signal('');

  ionViewWillEnter() {
    this.selected.set(this.auth.user()?.preferences.interests ?? []);
    this.city = this.auth.user()?.preferences.city ?? '';
    this.error.set('');
  }

  toggle(category: string) {
    this.error.set('');
    this.selected.update(items => items.includes(category) ? items.filter(item => item !== category) : [...items, category]);
  }

  async logout() {
    try { this.auth.logout(); await this.router.navigateByUrl('/ingresar'); }
    catch { this.error.set('No se pudo cerrar la sesión. Intentá nuevamente.'); }
  }

  async save() {
    try {
      this.auth.savePreferences(this.selected(), this.city);
      await this.router.navigateByUrl('/inicio');
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'No se pudieron guardar tus gustos.'); }
  }
}
