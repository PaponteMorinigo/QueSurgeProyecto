import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SaveButton } from './event-card';
import { eventDate, eventTime, SurgeEvent } from './events';

@Component({
  selector: 'qs-home-card',
  imports: [RouterLink, SaveButton],
  template: `
    <article [class]="compact() ? 'home-recommendation' : 'home-featured'">
      <a [routerLink]="['/eventos', event().id]" class="home-event-link">
        <img class="home-event-photo" [src]="event().photo" alt="" [attr.loading]="compact() ? 'lazy' : 'eager'">
        @if (!compact()) {
          <span class="home-date"><span class="figma-icon calendar-icon"><img src="figma/calendar.svg" alt=""></span>{{date.format(event().startsAt)}}</span>
        }
        <div class="home-event-text">
          <h3>{{event().title}}</h3>
          <p><span class="figma-icon location-icon"><img src="figma/location.svg" alt=""></span><span>{{event().venue}}</span></p>
          <p><span class="figma-icon time-icon"><img src="figma/time.svg" alt=""></span>{{time.format(event().startsAt)}} hs.</p>
        </div>
        @if (compact()) {
          <span class="home-card-meta"><span class="home-small-category" [title]="event().category"><span class="figma-icon category-icon"><img [src]="categoryIcons[event().category]" alt=""></span></span>
            <span class="home-date"><span class="figma-icon calendar-icon"><img src="figma/calendar.svg" alt=""></span>{{shortDate.format(event().startsAt)}}</span>
          </span>
        } @else {
          <span class="home-arrow"><img src="figma/arrow.svg" alt=""></span>
        }
      </a>
      @if (!compact()) { <qs-save [id]="event().id" [title]="event().title" [bookmark]="true" /> }
    </article>
  `
})
export class HomeCard {
  readonly event = input.required<SurgeEvent>();
  readonly compact = input(false);
  readonly categoryIcons: Record<string, string> = {
    'Música': 'figma/music-muted.svg', 'Gastronomía': 'figma/food.svg', 'Arte': 'figma/art.svg',
    'Teatro': 'figma/theater.svg', 'Bienestar': 'figma/art.svg', 'Comunidad': 'figma/theater.svg'
  };
  readonly date = eventDate;
  readonly time = eventTime;
  readonly shortDate = new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: 'short', timeZone: 'America/Asuncion' });
}
