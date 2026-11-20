import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { eventDate, Favorites, priceLabel, SurgeEvent } from './events';

@Component({
  selector: 'qs-save',
  imports: [IonIcon],
  template: `
    <button class="save-button" [class.bookmark-button]="bookmark()" type="button" [attr.aria-pressed]="favorites.has(id())"
      [attr.aria-label]="'Guardar ' + title() + ' en favoritos'" (click)="favorites.toggle(id())">
      @if (bookmark()) {
        <span class="bookmark-disc"><span class="figma-icon bookmark-icon"><img src="figma/bookmark.svg" alt=""></span></span>
      } @else { <ion-icon [name]="favorites.has(id()) ? 'heart' : 'heart-outline'" aria-hidden="true" /> }
    </button>
  `
})
export class SaveButton {
  readonly bookmark = input(false);
  readonly id = input.required<string>();
  readonly title = input.required<string>();
  readonly favorites = inject(Favorites);
}

@Component({
  selector: 'qs-event-card',
  imports: [RouterLink, IonIcon, SaveButton],
  template: `
    <article class="event-card" [class.hero]="featured()">
      <a class="event-link" [routerLink]="['/eventos', event().id]">
        <img [src]="event().photo" alt="" [attr.loading]="featured() ? 'eager' : 'lazy'">
        <div class="event-info">
          <div class="event-meta"><span class="tag">{{event().category}}</span><span>{{date.format(event().startsAt)}}</span> @if (!event().sourceUrl) { <span>{{event().organizer ? 'Evento local' : 'Demo'}}</span> }</div>
          <h2>{{event().title}}</h2>
          <p><ion-icon name="location-outline" aria-hidden="true" /> {{event().venue}}</p>
          <strong>{{price(event().price)}}</strong>
        </div>
      </a>
      <qs-save [id]="event().id" [title]="event().title" />
    </article>
  `
})
export class EventCard {
  readonly event = input.required<SurgeEvent>();
  readonly featured = input(false);
  readonly date = eventDate;
  readonly price = priceLabel;
}