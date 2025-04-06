import {RenderPosition, remove, render} from '../framework/render.js';
import {UpdateType, UserAction} from '../const';
import {generatePointId} from '../mock/data';
import PointFormView from '../view/point-form-view.js';

export default class NewPointPresenter {
  #destinations = null;
  #offers = null;
  #pointsContainer = null;
  #pointFormComponent = null;
  #handleDataUpdate = null;
  #handleDestroy = null;

  constructor({destinations, offers, pointsContainer, onDataUpdate, onDestroy}) {
    this.#destinations = destinations;
    this.#offers = offers;
    this.#pointsContainer = pointsContainer;
    this.#handleDataUpdate = onDataUpdate;
    this.#handleDestroy = onDestroy;
  }

  init() {
    if (this.#pointFormComponent !== null) {
      return;
    }

    this.#pointFormComponent = new PointFormView({
      destinations: this.#destinations,
      offers: this.#offers,
      onFormSubmit: this.#handleFormSubmit,
      onDeleteClick: this.#handleDeleteClick
    });

    render(this.#pointFormComponent, this.#pointsContainer, RenderPosition.AFTERBEGIN);

    document.addEventListener('keydown', this.#escKeydownHandler);
  }

  destroy() {
    if (this.#pointFormComponent === null) {
      return;
    }

    this.#handleDestroy();

    remove(this.#pointFormComponent);
    this.#pointFormComponent = null;

    document.removeEventListener('keydown', this.#escKeydownHandler);
  }

  #escKeydownHandler = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.destroy();
    }
  };

  #handleFormSubmit = (point) => {
    this.#handleDataUpdate(
      UserAction.ADD_POINT,
      UpdateType.MEDIUM,
      {id: generatePointId(), ...point}
    );

    this.destroy();
  };

  #handleDeleteClick = () => {
    this.destroy();
  };
}
