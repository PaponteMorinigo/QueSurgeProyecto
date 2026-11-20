import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Component, computed, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { NavigationEnd, provideRouter, Router, RouterLink, RouterLinkActive, Routes } from '@angular/router';
import { IonApp, IonRouterOutlet, IonIcon, provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, compassOutline, calendarOutline, heartOutline, heart, personOutline, locationOutline, arrowForward, chevronBack, chevronForward, searchOutline, businessOutline, addCircleOutline, ticketOutline, statsChartOutline } from 'ionicons/icons';
import { DemoSeed } from './app/demo-seed';
import { Auth, requireAccount, requireCompany, requirePerson, requireValidator } from './app/auth';

addIcons({ homeOutline, compassOutline, calendarOutline, heartOutline, heart, personOutline, locationOutline, arrowForward, chevronBack, chevronForward, searchOutline, businessOutline, addCircleOutline, ticketOutline, statsChartOutline });

const routes: Routes = [
  { path: 'demostracion', loadComponent: () => import('./app/demo-page').then(m => m.DemoPage) },
  { path: 'ingresar', loadComponent: () => import('./app/access').then(m => m.AccessPage) },
  { path: 'registro', loadComponent: () => import('./app/access').then(m => m.AccessPage) },
  { path: 'validar', canActivate: [requireValidator], loadComponent: () => import('./app/scanner').then(m => m.ScannerPage) },
  { path: 'gustos', canActivate: [requireAccount], loadComponent: () => import('./app/preferences').then(m => m.PreferencesPage) },
  { path: 'empresa', canActivate: [requireCompany], canActivateChild: [requireCompany], children: [
    { path: '', pathMatch: 'full', loadComponent: () => import('./app/company-pages').then(m => m.CompanyDashboard) },
    { path: 'eventos', loadComponent: () => import('./app/company-pages').then(m => m.CompanyEventsPage) },
    { path: 'eventos/nuevo', loadComponent: () => import('./app/company-editor').then(m => m.CompanyEditorPage) },
    { path: 'eventos/:id/editar', loadComponent: () => import('./app/company-editor').then(m => m.CompanyEditorPage) },
    { path: 'eventos/:id/vista-previa', loadComponent: () => import('./app/company-pages').then(m => m.CompanyPreviewPage) },
    { path: 'validadores', loadComponent: () => import('./app/validators').then(m => m.ValidatorsPage) },
    { path: 'ventas', loadComponent: () => import('./app/company-pages').then(m => m.CompanySalesPage) },
    { path: 'perfil', loadComponent: () => import('./app/company-pages').then(m => m.CompanyProfilePage) }
  ] },
  { path: '', pathMatch: 'full', redirectTo: 'ingresar' },
  { path: 'inicio', canActivate: [requirePerson], loadComponent: () => import('./app/discovery').then(m => m.HomePage) },
  { path: 'explorar', canActivate: [requirePerson], loadComponent: () => import('./app/discovery').then(m => m.ExplorePage) },
  { path: 'calendario', canActivate: [requirePerson], loadComponent: () => import('./app/calendar').then(m => m.CalendarPage) },
  { path: 'favoritos', canActivate: [requirePerson], loadComponent: () => import('./app/discovery').then(m => m.FavoritesPage) },
  { path: 'entradas', canActivate: [requirePerson], loadComponent: () => import('./app/tickets').then(m => m.TicketsPage) },
  { path: 'perfil', canActivate: [requirePerson], loadComponent: () => import('./app/profile').then(m => m.ProfilePage) },
  { path: 'eventos/:id/entradas', canActivate: [requirePerson], loadComponent: () => import('./app/purchase').then(m => m.PurchasePage) },
  { path: 'eventos/:id', canActivate: [requirePerson], loadComponent: () => import('./app/event-detail').then(m => m.EventDetailPage) },
  { path: '**', redirectTo: 'ingresar' }
];

@Component({
  selector: 'qs-app',
  imports: [IonApp, IonRouterOutlet, IonIcon, RouterLink, RouterLinkActive],
  template: `
    <ion-app>
      <header class="app-logo-bar"><a class="brand" [routerLink]="homeLink()" aria-label="Qué Surge · Volver al inicio">Qué <em>Surge.</em></a></header>
      <main class="app-body" id="contenido"><ion-router-outlet /></main>
      @if (showNavigation()) {
      <nav class="bottom-nav" aria-label="Navegación principal">
        @for (tab of tabs(); track tab.path) {
          <a [routerLink]="tab.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">
            @if (tab.asset) { <span class="figma-icon nav-icon"><img [src]="tab.asset" alt=""></span> }
            @else { <ion-icon [name]="tab.icon" aria-hidden="true" /> }<span>{{tab.label}}</span>
          </a>
        }
      </nav>
      }
    </ion-app>
  `
})
class App {
  private readonly auth = inject(Auth);
  private readonly demo = inject(DemoSeed);
  constructor() { void this.demo.install().catch(() => {}); }
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects.split(/[?#]/)[0])
  ), { initialValue: this.router.url });
  readonly showNavigation = computed(() => !!this.auth.user() &&
    !['/', '/ingresar', '/registro', '/gustos', '/demostracion'].includes(this.currentUrl()));
  readonly homeLink = computed(() => !this.auth.user() ? '/ingresar' :
    this.auth.user()?.role === 'company' ? '/empresa' : this.auth.user()?.role === 'validator' ? '/validar' : '/inicio');
  readonly tabs = computed(() => this.auth.user()?.role === 'validator' ? [{ path: '/validar', label: 'Validar QR', icon: 'ticket-outline', asset: null }] : this.auth.user()?.role === 'company' ? [
    { path: '/empresa', label: 'Panel', icon: 'business-outline', asset: null },
    { path: '/empresa/eventos', label: 'Eventos', icon: 'ticket-outline', asset: null },
    { path: '/empresa/eventos/nuevo', label: 'Crear', icon: 'add-circle-outline', asset: null },
    { path: '/empresa/ventas', label: 'Ventas', icon: 'stats-chart-outline', asset: null },
    { path: '/empresa/perfil', label: 'Empresa', icon: 'person-outline', asset: null }
  ] : [
    { path: '/inicio', label: 'Inicio', icon: 'home-outline', asset: 'figma/nav-home.svg' },
    { path: '/calendario', label: 'Agenda', icon: 'calendar-outline', asset: 'figma/nav-calendar.svg' },
    { path: '/entradas', label: 'Tickets', icon: 'ticket-outline', asset: 'figma/nav-tickets.svg' },
    { path: '/perfil', label: 'Perfil', icon: 'person-outline', asset: 'figma/nav-profile.svg' }
  ]);
}

bootstrapApplication(App, { providers: [provideIonicAngular({ mode: 'md' }), provideRouter(routes)] })
  .catch(error => console.error(error));
