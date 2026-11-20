import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonInput } from '@ionic/angular/standalone';
import { Favorites } from './events';
import { Auth } from './auth';

@Component({
  imports: [FormsModule, IonContent, IonIcon, IonInput, RouterLink],
  template: `
    <ion-content><div class="page">
      <h1>Mi perfil</h1>
      @if (auth.user(); as user) {
        <div class="profile-summary">
          <span class="avatar"><ion-icon name="person-outline" aria-hidden="true" /></span>
          <div><h2>{{user.name}}</h2><p>{{user.email}}</p>
            <a routerLink="/favoritos">{{favorites.count()}} eventos guardados</a>
          </div>
        </div>
        <form class="profile-form" (ngSubmit)="save()">
          <h2>Mis datos</h2>
          <ion-input name="name" label="Nombre" labelPlacement="stacked" fill="outline" [(ngModel)]="name"
            autocomplete="name" [maxlength]="80" [required]="true" />
          <button class="action" type="submit">Guardar cambios</button>
          <p class="feedback" role="status">{{feedback()}}</p>
        </form>
        <section class="profile-form preferences-summary">
          <h2>Mis gustos</h2>
          <div class="chips">
            @for (interest of user.preferences.interests; track interest) { <span class="tag">{{interest}}</span> }
          </div>
          <p>{{user.preferences.city || 'Elegí tu ciudad y tus intereses para personalizar el inicio.'}}</p>
          <a class="action" routerLink="/gustos">Editar mis gustos</a>
        </section>
        <button class="secondary-action" type="button" (click)="logout()">Cerrar sesión</button>
      } @else {
        <div class="empty"><h2>Tus planes empiezan con vos</h2>
          <p>Creá tu cuenta para elegir tus gustos y guardar tus eventos.</p>
          <a class="action" routerLink="/ingresar">Iniciar sesión</a>
          <p><a routerLink="/registro">Crear una cuenta</a></p>
        </div>
      }
    </div></ion-content>
  `
})
export class ProfilePage {
  readonly auth = inject(Auth);
  readonly favorites = inject(Favorites);
  private readonly router = inject(Router);
  readonly feedback = signal('');
  name = this.auth.user()?.name ?? '';

  ionViewWillEnter() { this.name = this.auth.user()?.name ?? ''; this.feedback.set(''); }

  save() {
    try { this.auth.updateProfile(this.name); this.feedback.set('Cambios guardados.'); }
    catch (error) { this.feedback.set(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.'); }
  }

  async logout() {
    try { this.auth.logout(); await this.router.navigateByUrl('/ingresar'); }
    catch (error) { this.feedback.set(error instanceof Error ? error.message : 'No se pudo cerrar la sesión.'); }
  }
}
