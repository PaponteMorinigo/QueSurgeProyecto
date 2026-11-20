import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { DemoSeed } from './demo-seed';
import { demoPassword } from './demo-fixtures';
import { amountLabel } from './events';

@Component({
  imports: [IonContent],
  template: `
    <ion-content><div class="page demo-page">
      <h1>Probá Qué Surge</h1>
      <p class="intro">Empresas ficticias con eventos publicados, compras y entradas QR ya cargadas.</p>
      <p class="field-hint">Podés abrir cada cuenta para revisar sus opciones. Los importes y las compras son de demostración.</p>
      @if (!demo.ready() && !demo.error()) { <p role="status">Cargando empresas y entradas…</p> }
      @if (demo.error()) {
        <div class="empty"><p class="form-error" role="alert">{{demo.error()}}</p><button class="action" type="button" (click)="retry()">Reintentar carga</button></div>
      }
      <h2 class="calendar-label">Empresas con ventas</h2>
      <div class="demo-grid">
        @for (company of demo.companiesInfo; track company.id) {
          <article class="demo-company">
            <img [src]="company.photo" alt="">
            <div class="demo-company-body"><h2>{{company.name}}</h2><p>{{company.description}}</p>
              @if (demo.ready()) {
                <div class="demo-summary"><span>{{demo.commerce.demoTotals(company.id).quantity}} entradas vendidas</span>
                  <strong>{{amount(demo.commerce.demoTotals(company.id).amount)}}</strong>
                  <span>{{demo.commerce.demoTotals(company.id).used}} {{demo.commerce.demoTotals(company.id).used === 1 ? 'entrada utilizada' : 'entradas utilizadas'}}</span>
                </div>
              }
              <div class="row-actions">
                <button type="button" class="action" [disabled]="!demo.ready()" (click)="open(company.id, '/empresa')">Ver panel</button>
                <button type="button" class="secondary-action" [disabled]="!demo.ready()" (click)="open(company.id, '/empresa/ventas')">Ver ventas</button>
                <button type="button" class="text-button" [disabled]="!demo.ready()" (click)="open(company.validatorId, '/validar')">Abrir validador QR</button>
              </div>
              <details><summary>Datos de acceso</summary><p>Empresa {{company.email}}</p><p>Validador {{company.validatorEmail}}</p></details>
            </div>
          </article>
        }
      </div>
      <h2 class="calendar-label">Compradores con entradas</h2>
      <div class="demo-grid">
        @for (buyer of demo.buyers; track buyer.id) {
          <article class="profile-form"><h2>{{buyer.name}}</h2><p>{{buyer.email}}</p>
            <p>Incluye entradas compradas de los eventos de ejemplo.</p>
            <button type="button" class="action" [disabled]="!demo.ready()" (click)="open(buyer.id, '/entradas')">Ver entradas de {{buyer.name}}</button>
          </article>
        }
      </div>
      <p class="field-hint demo-password">Contraseña de las cuentas de ejemplo <code>{{password}}</code></p>
      <p class="field-hint">Las entradas utilizadas permiten probar el rechazo de un segundo ingreso. Los cambios que hagas en estas cuentas quedan guardados en este navegador.</p>
      <p class="form-error" role="alert">{{error()}}</p>
    </div></ion-content>
  `
})
export class DemoPage {
  readonly demo = inject(DemoSeed);
  private readonly router = inject(Router);
  readonly error = signal('');
  readonly amount = amountLabel;
  readonly password = demoPassword;

  ionViewWillEnter() {
    void this.demo.install().then(() => this.demo.commerce.refresh()).catch(() => {});
  }
  retry() { void this.demo.install().catch(() => {}); }
  async open(id: string, route: string) {
    try { this.error.set(''); this.demo.openAccount(id); await this.router.navigateByUrl(route); }
    catch (error) { this.error.set(error instanceof Error ? error.message : 'No se pudo abrir la cuenta de ejemplo.'); }
  }
}
