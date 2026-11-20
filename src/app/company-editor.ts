import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { CompanyEventInput, CompanyStore, eventPhotos } from './company-store';
import { Auth } from './auth';
import { CoverLibrary } from './cover-library';
import { categories } from './event-types';

function emptyForm(): CompanyEventInput {
  return {
    title: '', description: '', category: 'Música', startsAt: '', venue: '', city: '',
    photo: eventPhotos[0].path, tickets: [{ id: crypto.randomUUID(), name: 'General', price: 0, capacity: 100 }]
  };
}

@Component({
  imports: [IonContent, FormsModule, RouterLink],
  template: `
    <ion-content><div class="page editor-page">
      <a class="back-link" routerLink="/empresa/eventos">← Mis eventos</a>
      <h1>{{id ? 'Editar evento' : 'Crear evento'}}</h1>
      <p class="intro">Dale forma a tu próximo encuentro.</p>
      @if (missing()) {
        <div class="empty"><h2>Evento no encontrado</h2><p>Volvé a los eventos de tu empresa para elegir otro.</p></div>
      } @else {
        <form class="business-form" (ngSubmit)="save()">
          <section class="profile-form">
            <h2>Información del evento</h2>
            <label for="event-title">Nombre del evento</label>
            <input id="event-title" name="title" [(ngModel)]="form.title" maxlength="100" required>
            <label for="event-description">Descripción</label>
            <textarea id="event-description" name="description" [(ngModel)]="form.description" rows="4" minlength="20" maxlength="4000" required></textarea>
            <label for="event-category">Categoría</label>
            <select id="event-category" name="category" [(ngModel)]="form.category">
              @for (category of categories; track category) { <option [value]="category">{{category}}</option> }
            </select>
            <label for="event-date">Fecha y hora en Paraguay</label>
            <input id="event-date" type="datetime-local" name="date" [(ngModel)]="localDate" required>
            <label for="event-venue">Lugar o recinto</label>
            <input id="event-venue" name="venue" [(ngModel)]="form.venue" maxlength="160" required>
            <label for="event-city">Ciudad</label>
            <input id="event-city" name="city" [(ngModel)]="form.city" maxlength="80" required>
          </section>
          <fieldset class="profile-form photo-fieldset"><legend>Portada</legend>
            <p class="field-hint">Subí las portadas de tu comercio o elegí una foto de la galería.</p>
            <label class="cover-upload-label" for="cover-upload">Agregar portadas del comercio</label>
            <input id="cover-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple
              [disabled]="uploading()" (change)="upload($event)">
            <p class="field-hint">JPG, PNG o WebP, hasta 10 MB por imagen. Se adaptan para mostrarse en la app.</p>
            <p role="status" class="feedback">{{uploadFeedback()}}</p>
            @if (covers.error()) { <p role="alert" class="form-error">{{covers.error()}}</p> }
            @if (covers.own().length) {
              <h2>Portadas de mi comercio</h2>
              <div class="photo-options commerce-covers">
                @for (cover of covers.own(); track cover.id) {
                  <label><input type="radio" name="photo" [value]="cover.id" [(ngModel)]="form.photo">
                    <img [src]="cover.url" alt=""><span>{{cover.name}}</span></label>
                }
              </div>
            }
            <div class="selected-cover">
              <img [src]="covers.resolve(form.photo)" alt="Vista previa de la portada seleccionada">
              <p class="field-hint">Portada seleccionada</p>
            </div>
            <h2>Galería de ejemplo</h2>
            <div class="photo-options">
              @for (photo of photos; track photo.path) {
                <label><input type="radio" name="photo" [value]="photo.path" [(ngModel)]="form.photo">
                  <img [src]="photo.path" alt=""><span>{{photo.label}}</span></label>
              }
            </div>
          </fieldset>
          <section class="profile-form">
            <h2>Tipos de entrada</h2><p class="field-hint">Precios en guaraníes. Usá 0 para entradas gratuitas.</p>
            @for (ticket of form.tickets; track ticket.id; let i = $index) {
              <fieldset class="ticket-editor">
                <legend>Entrada {{i + 1}}</legend>
                <label [for]="'ticket-name-' + i">Nombre</label>
                <input [id]="'ticket-name-' + i" [name]="'ticket-name-' + i" [(ngModel)]="ticket.name" maxlength="60" required>
                <div class="ticket-values">
                  <div><label [for]="'ticket-price-' + i">Precio (Gs.)</label>
                    <input [id]="'ticket-price-' + i" [name]="'ticket-price-' + i" type="number" [(ngModel)]="ticket.price" min="0" step="1" required></div>
                  <div><label [for]="'ticket-capacity-' + i">Cupo</label>
                    <input [id]="'ticket-capacity-' + i" [name]="'ticket-capacity-' + i" type="number" [(ngModel)]="ticket.capacity" min="1" max="1000000" step="1" required></div>
                </div>
                @if (form.tickets.length > 1) { <button class="text-button" type="button" (click)="removeTicket(ticket.id)">Quitar entrada {{i + 1}}</button> }
              </fieldset>
            }
            <button class="secondary-action" type="button" [disabled]="form.tickets.length >= 10" (click)="addTicket()">Agregar tipo de entrada</button>
          </section>
          <p role="alert" class="form-error">{{error()}}</p>
          <button class="action wide" type="submit" [disabled]="uploading()">Guardar y ver vista previa</button>
          @if (published) { <p class="field-hint">Los cambios se aplicarán al evento publicado.</p> }
        </form>
      }
    </div></ion-content>
  `
})
export class CompanyEditorPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(CompanyStore);
  private readonly auth = inject(Auth);
  readonly covers = inject(CoverLibrary);
  readonly uploading = signal(false);
  readonly uploadFeedback = signal('');
  private uploadGeneration = 0;
  get id() { return this.route.snapshot.paramMap.get('id'); }
  readonly categories = categories;
  readonly photos = eventPhotos;
  readonly missing = signal(false);
  readonly error = signal('');
  form = emptyForm();
  localDate = '';
  published = false;
  private version = 0;

  ionViewWillEnter() {
    this.uploadGeneration++;
    this.uploading.set(false);
    this.uploadFeedback.set('');
    this.error.set('');
    this.store.refresh();
    const event = this.store.find(this.id);
    this.missing.set(!!this.id && !event);
    this.form = event ? { ...event, tickets: event.tickets.map(ticket => ({ ...ticket })) } : emptyForm();
    this.version = event?.version ?? 0;
    this.published = event?.status === 'published';
    this.localDate = event ? this.toLocalDate(event.startsAt) : '';
  }

  ionViewWillLeave() { this.uploadGeneration++; }

  async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const ownerId = this.auth.user()?.id;
    if (!files.length || !ownerId || this.uploading()) return;
    const generation = ++this.uploadGeneration;
    this.uploading.set(true);
    this.error.set('');
    this.uploadFeedback.set('Cargando portadas…');
    let count = 0;
    try {
      for (const file of files) {
        if (generation !== this.uploadGeneration) return;
        const photo = await this.covers.add(file, ownerId);
        if (generation !== this.uploadGeneration) return;
        this.form.photo = photo;
        count++;
      }
      this.uploadFeedback.set(count === 1 ? 'Portada agregada y seleccionada.' : count + ' portadas agregadas. La última está seleccionada.');
    } catch (error) {
      if (generation !== this.uploadGeneration) return;
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar la portada.');
      this.uploadFeedback.set(count ? count + ' portadas guardadas en la galería.' : '');
    } finally {
      input.value = '';
      if (generation === this.uploadGeneration) this.uploading.set(false);
    }
  }

  private toLocalDate(value: string) {
    const parts = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Asuncion', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(new Date(value));
    return parts.replace(' ', 'T');
  }

  addTicket() {
    if (this.form.tickets.length < 10) this.form.tickets.push({ id: crypto.randomUUID(), name: '', price: 0, capacity: 100 });
  }

  removeTicket(id: string) { this.form.tickets = this.form.tickets.filter(ticket => ticket.id !== id); }

  async save() {
    this.error.set('');
    if (this.uploading()) return;
    try {
      await this.covers.ready;
      const startsAt = new Date(this.localDate + ':00-03:00');
      const saved = this.store.save({ ...this.form, startsAt: startsAt.toISOString() }, this.id, this.version);
      await this.router.navigateByUrl('/empresa/eventos/' + saved.id + '/vista-previa');
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'No se pudo guardar el evento.'); }
  }
}
