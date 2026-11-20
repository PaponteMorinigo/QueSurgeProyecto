import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { Auth } from './auth';
import { CompanyStore } from './company-store';
import { Commerce } from './commerce';

@Component({
  imports: [FormsModule, IonContent],
  template: `
    <ion-content><div class="page access-page"><h1>Validar entrada</h1><p class="intro">{{auth.user()?.name}} · Accesos autorizados</p>
      <div class="profile-form">
        <label for="scan-event">Evento</label>
        <select id="scan-event" [disabled]="busy()" [(ngModel)]="eventId" (ngModelChange)="stopCamera()">
          <option value="">Elegí un evento</option>
          @for (event of store.assigned(); track event.id) { <option [value]="event.id">{{event.title}}</option> }
        </select>
        <video #video class="scanner-video" playsinline muted [hidden]="!camera()"></video>
        <button type="button" class="action wide" [disabled]="busy() || !eventId" (click)="startCamera()">Escanear con cámara</button>
        <label for="qr-file">Leer QR desde una imagen</label>
        <input id="qr-file" type="file" accept="image/*" [disabled]="busy() || !eventId" (change)="readImage($event)">
        <form class="scanner-code-form" (ngSubmit)="validate()">
          <label for="scan-code">Código de la entrada</label>
          <textarea id="scan-code" name="code" rows="3" [(ngModel)]="code" placeholder="QS1…"></textarea>
          <button type="submit" class="secondary-action" [disabled]="busy() || !eventId || !code.trim()">Validar código</button>
        </form>
        <p role="status" class="scan-result" [class.accepted]="accepted()">{{result()}}</p>
      </div>
      <h2 class="calendar-label">Lecturas registradas</h2>
      @for (ticket of commerce.scans(); track ticket.id) {
        <article class="ticket-summary"><div><strong>{{ticket.eventTitle}}</strong><p>{{ticket.typeName}}</p></div><span>{{formatTime(ticket.usedAt!)}}</span></article>
      } @empty { <p class="field-hint">Las entradas aceptadas aparecerán acá.</p> }
      <button class="secondary-action" type="button" (click)="logout()">Cerrar sesión</button>
    </div></ion-content>
  `
})
export class ScannerPage {
  readonly auth = inject(Auth);
  readonly store = inject(CompanyStore);
  readonly commerce = inject(Commerce);
  private readonly router = inject(Router);
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private readonly reader = new BrowserQRCodeReader();
  private controls?: IScannerControls;
  private generation = 0;
  readonly busy = signal(false);
  readonly camera = signal(false);
  readonly accepted = signal(false);
  readonly result = signal('');
  code = ''; eventId = '';
  readonly formatTime = (value: number) => new Intl.DateTimeFormat('es-PY', { dateStyle: 'short', timeStyle: 'short' }).format(value);

  ionViewWillEnter() {
    this.store.refresh(); this.auth.refreshAccounts();
    this.eventId = this.store.assigned()[0]?.id ?? '';
    this.result.set(''); this.code = '';
    void this.commerce.refresh().catch(() => this.result.set('No se pudo recuperar el historial.'));
  }
  ionViewWillLeave() { this.stopCamera(); }
  stopCamera() { this.generation++; this.controls?.stop(); this.controls = undefined; this.camera.set(false); }

  async startCamera() {
    this.stopCamera();
    const generation = this.generation;
    this.result.set('');
    this.camera.set(true);
    try {
      const controls = await this.reader.decodeFromVideoDevice(undefined, this.video()?.nativeElement, (result, error, controls) => {
        if (generation !== this.generation) { controls.stop(); return; }
        if (result && !this.busy()) { controls.stop(); this.code = result.getText(); void this.validate(); }
      });
      if (generation !== this.generation) controls.stop();
      else this.controls = controls;
    } catch {
      this.camera.set(false);
      this.result.set('No se pudo abrir la cámara. Revisá el permiso o elegí una imagen del QR.');
    }
  }
  async readImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.busy()) return;
    this.stopCamera();
    const generation = this.generation;
    this.busy.set(true);
    const url = URL.createObjectURL(file);
    try {
      const result = await this.reader.decodeFromImageUrl(url);
      if (generation !== this.generation) return;
      this.busy.set(false);
      this.code = result.getText();
      await this.validate();
    } catch { this.accepted.set(false); this.result.set('No se encontró un QR legible en la imagen.'); }
    finally { URL.revokeObjectURL(url); input.value = ''; if (generation === this.generation) this.busy.set(false); }
  }
  async validate() {
    if (this.busy()) return;
    this.stopCamera(); this.busy.set(true); this.accepted.set(false); this.result.set('');
    try {
      const ticket = await this.commerce.validate(this.code, this.eventId);
      this.accepted.set(true);
      this.result.set('Ingreso autorizado · ' + ticket.typeName + '. Entrada marcada como utilizada.');
    } catch (error) { this.result.set(error instanceof Error ? error.message : 'No se pudo validar la entrada.'); }
    finally { this.busy.set(false); }
  }
  async logout() {
    this.stopCamera();
    try { this.auth.logout(); await this.router.navigateByUrl('/ingresar'); }
    catch { this.result.set('No se pudo cerrar la sesión.'); }
  }
}
