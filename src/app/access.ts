import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonInput } from '@ionic/angular/standalone';
import { AccountRole, Auth } from './auth';

@Component({
  imports: [FormsModule, RouterLink, IonContent, IonInput],
  template: `
    <ion-content class="access-content"><div class="page access-page">
      <span class="brand">Qué <em>Surge.</em></span>
      <div class="access-heading">
        <h1>{{register ? 'Creá tu cuenta' : 'Iniciar sesión'}}</h1>
        <p class="intro">{{register ? (role === 'company' ? 'Publicá tus eventos y administrá tus entradas desde un solo lugar.' : 'Creá tu cuenta y descubrí planes según tus gustos.') : 'Ingresá con tu correo. Te llevamos al espacio de tu cuenta.'}}</p>
      </div>
      <form class="profile-form" (ngSubmit)="submit()">
        @if (register) {
          <fieldset class="interest-fieldset">
            <legend>Tipo de cuenta</legend>
            <div class="chips">
              <button type="button" [attr.aria-pressed]="role === 'person'" (click)="role = 'person'">Persona</button>
              <button type="button" [attr.aria-pressed]="role === 'company'" (click)="role = 'company'">Empresa</button>
            </div>
          </fieldset>
          @if (role === 'company') {
            <ion-input name="companyName" label="Nombre de la empresa" labelPlacement="stacked" fill="outline"
              [(ngModel)]="companyName" autocomplete="organization" [maxlength]="100" [required]="true" />
          }
          <ion-input name="name" [label]="role === 'company' ? 'Persona de contacto' : 'Nombre'" labelPlacement="stacked" fill="outline" autocomplete="name"
            [(ngModel)]="name" [maxlength]="80" [required]="true" />
        }
        <ion-input name="email" type="email" label="Correo electrónico" labelPlacement="stacked" fill="outline"
          autocomplete="email" [(ngModel)]="email" [maxlength]="254" [required]="true" />
        <ion-input name="password" [type]="showPassword() ? 'text' : 'password'" label="Contraseña"
          labelPlacement="stacked" fill="outline" [autocomplete]="register ? 'new-password' : 'current-password'"
          [(ngModel)]="password" [required]="true" />
        <button type="button" class="text-button" [attr.aria-pressed]="showPassword()" (click)="showPassword.set(!showPassword())">
          {{showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'}}
        </button>
        @if (register) {
          <p class="field-hint">Usá al menos 8 caracteres.</p>
          <ion-input name="confirmation" [type]="showPassword() ? 'text' : 'password'" label="Confirmar contraseña"
            labelPlacement="stacked" fill="outline" autocomplete="new-password" [(ngModel)]="confirmation" [required]="true" />
        }
        <p role="alert" class="form-error">{{error()}}</p>
        <button type="submit" class="action wide" [disabled]="busy()">
          {{busy() ? 'Un momento…' : register ? 'Crear mi cuenta' : 'Iniciar sesión'}}
        </button>
      </form>
      <p class="access-switch">{{register ? '¿Ya tenés cuenta?' : '¿Todavía no tenés cuenta?'}}
        <a [routerLink]="register ? '/ingresar' : '/registro'">{{register ? 'Ingresá' : 'Registrate'}}</a>
      </p>
      <p class="field-hint">Acceso de demostración. Tu cuenta se guarda en este navegador y dispositivo.</p>
    </div></ion-content>
  `
})
export class AccessPage {
  readonly register = inject(ActivatedRoute).snapshot.routeConfig?.path === 'registro';
  readonly auth = inject(Auth);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  role: AccountRole = 'person';
  companyName = '';
  name = '';
  email = '';
  password = '';
  confirmation = '';

  async submit() {
    if (this.busy()) return;
    this.error.set('');
    if (this.register && this.password !== this.confirmation) {
      this.error.set('Las contraseñas deben coincidir.');
      return;
    }
    this.busy.set(true);
    try {
      await this.auth.enter(this.register, this.name, this.email, this.password, this.role, this.companyName);
      this.password = '';
      this.confirmation = '';
      const user = this.auth.user();
      await this.router.navigateByUrl(user?.role === 'company' ? '/empresa' : user?.role === 'validator' ? '/validar' : this.auth.needsPreferences() ? '/gustos' : '/inicio');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo ingresar. Intentá nuevamente.');
    } finally { this.busy.set(false); }
  }
}
