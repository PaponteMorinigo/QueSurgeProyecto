import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonSearchbar } from '@ionic/angular/standalone';
import { ExternalEvents } from './external-events';
import { HomeCard } from './home-card';
import { EventCard } from './event-card';
import { categories, Category, EventCatalog, Favorites } from './events';

@Component({
  imports: [IonContent, RouterLink, HomeCard],
  template: `    <ion-content class="figma-home-content"><div class="figma-home">
      <header class="home-heading">
        <h1>Explorá eventos<br>cerca tuyo</h1>
        <a class="home-profile" routerLink="/perfil" aria-label="Ir a mi perfil"><img src="figma/profile-avatar.png" alt=""></a>
      </header>
      <div class="home-search-row">
        <label class="home-search"><span class="sr-only">Buscar evento</span>
          <input #search type="search" placeholder="Buscar evento" [value]="query()" (input)="query.set(search.value)">
          <span class="figma-icon search-icon"><img src="figma/search.svg" alt=""></span>
        </label>
        <a routerLink="/explorar" class="home-filter-button" aria-label="Abrir filtros"><span class="figma-icon filter-icon"><img src="figma/filters.svg" alt=""></span></a>
      </div>
      <div class="home-preferences"><a routerLink="/gustos">Mis preferencias</a></div>
      <div class="home-categories" aria-label="Categorías">
        @for (item of categoryChips; track item.category) {
          <button type="button" [attr.aria-pressed]="category() === item.category" (click)="toggleCategory(item.category)">
            <span class="figma-icon category-icon"><img [src]="item.category === 'Música' && category() === 'Música' ? 'figma/music.svg' : item.icon" alt=""></span>{{item.label}}
          </button>
        }
      </div>
      @if (results().length) {
        <section>
          <div class="home-section-heading"><h2>Destacados de hoy</h2><a routerLink="/explorar">Ver todos</a></div>
          <div class="home-carousel" aria-label="Eventos destacados">
            @for (event of results().slice(0, 3); track event.id) { <qs-home-card [event]="event" /> }
          </div>
        </section>
        @if (results().length > 3) {
          <section class="home-recommendations">
            <div class="home-section-heading"><h2>Recomendados para vos</h2><a routerLink="/explorar">Ver todos</a></div>
            @for (event of results().slice(3, 7); track event.id) { <qs-home-card [event]="event" [compact]="true" /> }
          </section>
        }
      } @else {
        <div class="empty"><h2>No encontramos eventos</h2><p>No hay coincidencias con tus gustos, ciudad y búsqueda actuales.</p>
          <a class="action" routerLink="/gustos">Cambiar preferencias</a>
          <button class="text-button" type="button" (click)="reset()">Limpiar búsqueda</button></div>
      }
      <p class="agenda-status" role="status">{{agenda.status()}}</p>
    </div></ion-content>
  `})
export class HomePage {
  private readonly catalog = inject(EventCatalog);
  readonly agenda = this.catalog.external;
  readonly query = signal('');
  readonly category = signal<Category | null>(null);
  readonly categoryChips: { category: Category; label: string; icon: string }[] = [
    { category: 'Música', label: 'Música', icon: 'figma/music-muted.svg' },
    { category: 'Gastronomía', label: 'Comida', icon: 'figma/food.svg' },
    { category: 'Arte', label: 'Arte', icon: 'figma/art.svg' },
    { category: 'Teatro', label: 'Teatro', icon: 'figma/theater.svg' }
  ];
  readonly results = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const category = this.category();
    const query = normalize(this.query().trim());
    const upcoming = this.catalog.personalized().filter(event => event.startsAt >= today &&
      (!category || event.category === category) &&
      normalize([event.title, event.venue, event.city].join(' ')).includes(query));
    return upcoming.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  });

  toggleCategory(category: Category) { this.category.update(value => value === category ? null : category); }
  reset() { this.category.set(null); this.query.set(''); }
}

function normalize(value: string) {
  return value.toLocaleLowerCase('es-PY').normalize('NFD').replace(/\p{M}/gu, '');
}

@Component({
  imports: [IonContent, IonSearchbar, EventCard, RouterLink],
  template: `
    <ion-content><div class="page">
      <h1>Explorar</h1><p class="agenda-status" role="status">{{agenda.status()}}</p><button type="button" class="text-button" (click)="agenda.refresh()">Actualizar agenda externa</button>
      <p class="intro">Descubrí eventos en distintas ciudades de Paraguay.</p>
      <ion-searchbar aria-label="Buscar eventos" placeholder="Evento, lugar o ciudad" [value]="query()"
        (ionInput)="query.set($event.detail.value ?? '')" />
      <div class="chips" aria-label="Categorías">
        <button type="button" [attr.aria-pressed]="category() === null" (click)="category.set(null)">Todos</button>
        @for (item of categories; track item) {
          <button type="button" [attr.aria-pressed]="category() === item" (click)="category.set(item)">{{item}}</button>
        }
      </div>
      <p class="result-count" role="status">{{results().length}} {{results().length === 1 ? 'evento' : 'eventos'}}</p>
      <div class="event-grid">
        @for (event of results(); track event.id) { <qs-event-card [event]="event" /> }
      </div>
      @if (!results().length) {
        <div class="empty"><p>No hay eventos que coincidan con tus preferencias y búsqueda.</p><button type="button" class="action" (click)="reset()">Limpiar filtros</button> <a routerLink="/gustos">Cambiar preferencias</a></div>
      }
    </div></ion-content>
  `
})
export class ExplorePage {
  readonly agenda = inject(ExternalEvents);
  readonly categories = categories;
  readonly category = signal<Category | null>(null);
  readonly query = signal('');
  private readonly catalog = inject(EventCatalog);
  readonly results = computed(() => {
    const query = normalize(this.query().trim());
    const category = this.category();
    return this.catalog.personalized().filter(event =>
      (!category || event.category === category) &&
      normalize([event.title, event.venue, event.city, event.category].join(' ')).includes(query));
  });

  reset() {
    this.category.set(null);
    this.query.set('');
  }
}

@Component({
  imports: [IonContent, IonIcon, RouterLink, EventCard],
  template: `
    <ion-content><div class="page">
      <h1>Favoritos</h1>
      <p class="intro">Tus planes guardados, en un solo lugar.</p>
      @if (events().length) {
        <div class="event-grid">
          @for (event of events(); track event.id) { <qs-event-card [event]="event" /> }
        </div>
      } @else {
        <div class="empty"><ion-icon name="heart-outline" aria-hidden="true" />
          <h2>Todavía no guardaste eventos</h2><p>Tocá el corazón de un evento para encontrarlo acá.</p>
          <a class="action" routerLink="/explorar">Explorar eventos</a>
        </div>
      }
    </div></ion-content>
  `
})
export class FavoritesPage {
  private readonly catalog = inject(EventCatalog);
  private readonly favorites = inject(Favorites);
  readonly events = computed(() => this.favorites.allIds().flatMap(id => { const event = this.catalog.find(id); return event ? [event] : []; }));
}