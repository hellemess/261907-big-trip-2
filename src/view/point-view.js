import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import AbstractView from '../framework/view/abstract-view';

dayjs.extend(duration);

const createPointTimeTemplate = (pointFrom, pointTo) => {
  const pointDuration = dayjs.duration(pointTo - pointFrom).$d;
  const days = `${pointTo.diff(pointFrom, 'days') ? `${`${pointTo.diff(pointFrom, 'days')}`.padStart(2, '0')}D ` : ''}`;
  const hours = `${pointTo.diff(pointFrom, 'days') || pointDuration.hours ? `${`${pointDuration.hours}`.padStart(2, '0')}H ` : ''}`;
  const minutes = `${`${pointDuration.minutes}`.padStart(2, '0')}M`;

  return `
    <p class="event__time">
      <time class="event__start-time" datetime="${pointFrom.format('YYYY-MM-DD[T]HH:mm')}">${pointFrom.format('HH:mm')}</time>
      &mdash;
      <time class="event__end-time" datetime="${pointTo.format('YYYY-MM-DD[T]HH:mm')}">${pointTo.format('HH:mm')}</time>
    </p>
    <p class="event__duration">${days}${hours}${minutes}</p>
  `;
};

const createPointTemplate = ({name}, offers, {basePrice, dateFrom, dateTo, type, isFavorite}) => {
  const pointFrom = dayjs(dateFrom);
  const pointTo = dayjs(dateTo);

  return `
    <li class="trip-events__item">
      <div class="event">
        <time class="event__date" datetime="${pointFrom.format('YYYY-MM-DD')}">${pointFrom.format('MMM D')}</time>
        <div class="event__type">
          <img class="event__type-icon" width="42" height="42" src="img/icons/${type.toLowerCase()}.png" alt="Event type icon">
        </div>
        <h3 class="event__title">${type} ${name}</h3>
        <div class="event__schedule">
          ${createPointTimeTemplate(pointFrom, pointTo)}
        </div>
        <p class="event__price">
          &euro;&nbsp;<span class="event__price-value">${basePrice}</span>
        </p>
        <h4 class="visually-hidden">Offers:</h4>
        <ul class="event__selected-offers">
          ${offers.map((it) => `
            <li class="event__offer">
              <span class="event__offer-title">${it.title}</span>
              &plus;&euro;&nbsp;
              <span class="event__offer-price">${it.price}</span>
            </li>
          `).join('')}
        </ul>
        <button class="event__favorite-btn${isFavorite ? '  event__favorite-btn--active' : ''}" type="button">
          <span class="visually-hidden">Add to favorite</span>
          <svg class="event__favorite-icon" width="28" height="28" viewBox="0 0 28 28">
            <path d="M14 21l-8.22899 4.3262 1.57159-9.1631L.685209 9.67376 9.8855 8.33688 14 0l4.1145 8.33688 9.2003 1.33688-6.6574 6.48934 1.5716 9.1631L14 21z"/>
          </svg>
        </button>
        <button class="event__rollup-btn" type="button">
          <span class="visually-hidden">Open event</span>
        </button>
      </div>
    </li>
  `;
};

export default class PointView extends AbstractView {
  #destination = null;
  #offers = null;
  #point = null;
  #handleRollupClick = null;
  #handleFavoriteClick = null;

  constructor({destination, offers, point, onRollupClick, onFavoriteClick}) {
    super();
    this.#destination = destination;
    this.#offers = offers;
    this.#point = point;
    this.#handleRollupClick = onRollupClick;
    this.#handleFavoriteClick = onFavoriteClick;

    this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#rollupClickHandler);
    this.element.querySelector('.event__favorite-btn').addEventListener('click', this.#favoriteClickHandler);
  }

  get template() {
    return createPointTemplate(this.#destination, this.#offers, this.#point);
  }

  #rollupClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleRollupClick();
  };

  #favoriteClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleFavoriteClick();
  };
}
