import dayjs from 'dayjs';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import {TYPES} from '../const.js';
import {getRandomArrayElement} from '../utils/common.js';
import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';

const BLANK_EVENT = {
  id: 0,
  basePrice: '',
  dateFrom: new Date().toISOString(),
  dateTo: new Date().toISOString(),
  destination: '',
  isFavorite: 0,
  offers: [],
  type: getRandomArrayElement(TYPES)
};

const getDestinationTemplate = ({description, pictures}) => `
  <section class="event__section  event__section--destination">
    <h3 class="event__section-title  event__section-title--destination">Destination</h3>
    <p class="event__destination-description">${description}</p>
    ${pictures.length ? `
      <div class="event__photos-container">
        <div class="event__photos-tape">
          ${pictures.map(({description: alt, src}) => `<img class="event__photo" src="${src}" alt="${alt}">`).join('')}
        </div>
      </div>
    ` : ''}
  </section>
`;

const getDestinationsListTemplate = ({name}) => `<option value="${name}"></option>`;

const getOptionTemplate = ({id, title, price}, pointId, pointOffers) => `
  <div class="event__offer-selector">
    <input class="event__offer-checkbox  visually-hidden" id="event-offer-${id}-${pointId}" type="checkbox" name="event-offer-${id}" value=${id} ${pointOffers.includes(id) ? 'checked' : ''}>
    <label class="event__offer-label" for="event-offer-${id}-${pointId}">
      <span class="event__offer-title">${title}</span>
      &plus;&euro;&nbsp;
      <span class="event__offer-price">${price}</span>
    </label>
  </div>
`;

const getTypeTemplate = (type, isChecked, id) => `
  <div class="event__type-item">
    <input id="event-type-${type}-${id}" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${type}" ${isChecked ? 'checked' : ''} />
    <label class="event__type-label  event__type-label--${type}" for="event-type-${type}-${id}">${type[0].toUpperCase()}${type.slice(1)}</label>
  </div>
`;

const createPointFormTemplate = (destinations, offersByType, point) => {
  const {id, basePrice, dateFrom, dateTo, destination, offers, type} = point;
  const pointFrom = dayjs(dateFrom);
  const pointTo = dayjs(dateTo);
  const isNew = destination === '';
  const destinationInfo = destinations.find((it) => destination === it.id);
  const isSubmitDisabled = pointFrom > pointTo;

  const typesTemplate = TYPES.map((it) => getTypeTemplate(it, it === type, id)).join('');
  const destinationsListTemplate = destinations.map((it) => getDestinationsListTemplate(it)).join('');
  const optionsTemplate = offersByType.map((it) => getOptionTemplate(it, id, offers)).join('');
  const destinationTemplate = destinationInfo ? getDestinationTemplate(destinationInfo) : null;

  return `
    <li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type  event__type-btn" for="event-type-toggle-${id}">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle  visually-hidden" id="event-type-toggle-${id}" type="checkbox">
            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${typesTemplate}
              </fieldset>
            </div>
          </div>
          <div class="event__field-group  event__field-group--destination">
            <label class="event__label  event__type-output" for="event-destination-${id}">
              ${type}
            </label>
            <input class="event__input  event__input--destination" id="event-destination-${id}" type="text" name="event-destination" value="${destinationInfo ? destinationInfo.name : ''}" list="destination-list-${id}">
            <datalist id="destination-list-${id}">
              ${destinationsListTemplate}
            </datalist>
          </div>
          <div class="event__field-group  event__field-group--time">
            <label class="visually-hidden" for="event-start-time-${id}">From</label>
            <input class="event__input  event__input--time" id="event-start-time-${id}" type="text" name="event-start-time" value="${pointFrom.format('DD/MM/YY HH:mm')}">
            &mdash;
            <label class="visually-hidden" for="event-end-time-${id}">To</label>
            <input class="event__input  event__input--time" id="event-end-time-${id}" type="text" name="event-end-time" value="${pointTo.format('DD/MM/YY HH:mm')}">
          </div>
          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price-${id}">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input  event__input--price" id="event-price-${id}" type="text" name="event-price" value="${basePrice}">
          </div>
          <button class="event__save-btn  btn  btn--blue" type="submit"${isSubmitDisabled ? ' disabled' : ''}>Save</button>
          <button class="event__reset-btn" type="reset">${isNew ? 'Cancel' : 'Delete'}</button>
          ${!isNew ? `
            <button class="event__rollup-btn" type="button">
              <span class="visually-hidden">Open event</span>
            </button>
          ` : ''}
        </header>
        ${optionsTemplate || destinationTemplate ? `
          <section class="event__details">
            ${optionsTemplate ? `
              <section class="event__section  event__section--offers">
                <h3 class="event__section-title  event__section-title--offers">Offers</h3>
                <div class="event__available-offers">
                  ${optionsTemplate}
                </div>
              </section>
            ` : ''}
            ${destinationTemplate ?? ''}
          </section>
          ` : ''}
      </form>
    </li>
  `;
};

export default class PointFormView extends AbstractStatefulView {
  #destinations = null;
  #offers = null;
  #point = null;
  #datepickers = new Map();
  #handleFormSubmit = null;
  #handleFormRollupClick = null;

  constructor({destinations, offers, point = BLANK_EVENT, onFormSubmit, onFormRollupClick}) {
    super();
    this.#destinations = destinations;
    this.#offers = offers;
    this.#point = point;
    this.#handleFormSubmit = onFormSubmit;
    this.#handleFormRollupClick = onFormRollupClick;

    this._setState(PointFormView.parsePointToState(this.#point));
    this._restoreHandlers();
  }

  get template() {
    const offersByType = this.#offers.find((it) => it.type === this._state.type).offers;

    return createPointFormTemplate(this.#destinations, offersByType, this._state);
  }

  removeElement() {
    super.removeElement();
    this.#destroyDatepickers();
  }

  reset(point) {
    this.updateElement(
      PointFormView.parsePointToState(point)
    );
  }

  _restoreHandlers() {
    this.element.querySelector('form').addEventListener('submit', this.#formSubmitHandler);
    this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#rollupClickHandler);
    this.element.querySelector('.event__type-group').addEventListener('change', this.#typeChangeHandler);
    this.element.querySelector('.event__input--destination').addEventListener('keydown', this.#destinationKeydownHandler);
    this.element.querySelector('.event__input--destination').addEventListener('input', this.#destinationInputHandler);
    this.element.querySelector('.event__input--destination').addEventListener('blur', this.#destinationBlurHandler);
    this.element.querySelector('.event__input--price').addEventListener('blur', this.#priceBlurHandler);
    this.element.querySelector('.event__available-offers')?.addEventListener('change', this.#offersChangeHandler);
    this.#setDatepickers();
  }

  #setDatepicker(selector, defaultDate) {
    return flatpickr(
      this.element.querySelector(selector),
      {
        dateFormat: 'd/m/y H:i',
        defaultDate,
        enableTime: true,
        onChange: this.#dateChangeHandler
      }
    );
  }

  #setDatepickers() {
    this.#destroyDatepickers();
    this.#datepickers.set('dateFrom', this.#setDatepicker('[name="event-start-time"]', this._state.dateFrom));
    this.#datepickers.set('dateTo', this.#setDatepicker('[name="event-end-time"]', this._state.dateTo));
  }

  #destroyDatepickers() {
    this.#datepickers.forEach((it) => {
      it.destroy();
    });

    this.#datepickers.clear();
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    this.#handleFormSubmit(this._state);
  };

  #rollupClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleFormRollupClick();
  };

  #typeChangeHandler = (evt) => {
    if (!evt.target.classList.contains('event__type-input')) {
      return;
    }

    evt.preventDefault();
    this.updateElement({
      type: evt.target.value,
      offers: []
    });
  };

  #destinationKeydownHandler = (evt) => {
    evt.preventDefault();
    evt.target.value = '';
  };

  #destinationInputHandler = (evt) => {
    evt.preventDefault();

    if (evt.target.value) {
      this.updateElement({
        destination: this.#destinations.find((it) => it.name === evt.target.value).id
      });
    }
  };

  #destinationBlurHandler = (evt) => {
    if (!evt.target.value) {
      evt.target.value = this.#destinations.find((it) => it.id === this._state.destination).name;
    }
  };

  #priceBlurHandler = (evt) => {
    const newValue = Math.abs(parseInt(evt.target.value, 10));

    if (isNaN(newValue)) {
      evt.target.value = this._state.basePrice;
    } else {
      evt.target.value = newValue;

      this._setState({
        basePrice: newValue
      });
    }
  };

  #offersChangeHandler = (evt) => {
    if (!evt.target.classList.contains('event__offer-checkbox')) {
      return;
    }

    const chosenOffers = Array.from(this.element.querySelectorAll('.event__offer-checkbox:checked')).map((it) => it.value);

    this._setState({
      offers: chosenOffers
    });
  };

  #dateChangeHandler = ([userDate], dateString, {element}) => {
    const dateFrom = element.name === 'event-start-time' ? userDate.toISOString() : this._state.dateFrom;
    const dateTo = element.name === 'event-end-time' ? userDate.toISOString() : this._state.dateTo;

    this.updateElement({
      dateFrom,
      dateTo
    });
  };

  static parsePointToState(point) {
    return {...point};
  }

  static parseStateToPoint(state) {
    return {...state};
  }
}
