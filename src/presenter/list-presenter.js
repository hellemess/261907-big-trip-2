import {remove, render} from '../framework/render.js';
import {Filters, SortType, UpdateType, UserAction} from '../const.js';
import {filter} from '../utils/filter.js';
import {sortDay, sortPrice, sortTime} from '../utils/trip.js';
import SortView from '../view/sort-view.js';
import NoPointView from '../view/no-points-view.js';
import TripPointsListView from '../view/trip-points-list-view.js';
import TripHeaderPresenter from './trip-header-presenter.js';
import NewPointPresenter from './new-point-presenter.js';
import PointPresenter from './point-presenter.js';

export default class ListPresenter {
  #filtersModel = null;
  #destinationsModel = null;
  #offersModel = null;
  #pointsModel = null;
  #tripHeaderPresenter = null;
  #newPointPresenter = null;
  #pointsPresenters = new Map();
  #currentSortType = SortType.DAY;
  #filterType = Filters.EVERYTHING;
  #noPointsComponent = null;
  #sortComponent = null;
  #pointsListComponent = new TripPointsListView();
  #header = null;
  #main = null;

  constructor({header, main, filtersModel, destinationsModel, offersModel, pointsModel, onNewPointDestroy}) {
    this.#header = header;
    this.#main = main;
    this.#filtersModel = filtersModel;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#pointsModel = pointsModel;

    this.#pointsModel.addObserver(this.#handleModelEvent);
    this.#filtersModel.addObserver(this.#handleModelEvent);

    this.#newPointPresenter = new NewPointPresenter({
      destinations: this.destinations,
      offers: this.offers,
      pointsContainer: this.#pointsListComponent.element,
      onDataUpdate: this.#handleViewAction,
      onDestroy: onNewPointDestroy
    });
  }

  get destinations() {
    return this.#destinationsModel.destinations;
  }

  get offers() {
    return this.#offersModel.offers;
  }

  get points() {
    this.#filterType = this.#filtersModel.filter;

    const points = this.#pointsModel.points;
    const filteredPoints = filter[this.#filterType](points);

    switch (this.#currentSortType) {
      case SortType.TIME:
        return filteredPoints.sort(sortTime);
      case SortType.PRICE:
        return filteredPoints.sort(sortPrice);
    }

    return filteredPoints.sort(sortDay);
  }

  get tripPoints() {
    return this.#pointsModel.points;
  }

  init() {
    this.#renderPoints();
  }

  createPoint() {
    this.#currentSortType = SortType.DAY;
    this.#filtersModel.setFilter(UpdateType.MAJOR, Filters.EVERYTHING);
    this.#newPointPresenter.init();
  }

  #handleModeChange = () => {
    this.#newPointPresenter.destroy();

    this.#pointsPresenters.forEach((it) => {
      it.resetView();
    });
  };

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearPoints();
    this.#renderPoints(this.points);
  };

  #handleViewAction = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.ADD_POINT:
        this.#pointsModel.addPoint(updateType, update);

        break;
      case UserAction.UPDATE_POINT:
        this.#pointsModel.updatePoint(updateType, update);

        break;
      case UserAction.DELETE_POINT:
        this.#pointsModel.deletePoint(updateType, update);

        break;
    }
  };

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointsPresenters.get(data.id).init(data);

        break;
      case UpdateType.MINOR:
        this.#pointsPresenters.get(data.id).init(data);
        this.#tripHeaderPresenter.init(this.points);

        break;
      case UpdateType.MEDIUM:
        this.#clearPoints();
        this.#renderPoints();

        break;
      case UpdateType.MAJOR:
        this.#clearPoints({resetSortType: true});
        this.#renderPoints({resetSortType: true});

        break;
    }
  };

  #renderNoPoints() {
    this.#noPointsComponent = new NoPointView({
      filterType: this.#filterType
    });

    render(this.#noPointsComponent, this.#main);
  }

  #renderTripHeader() {
    this.#tripHeaderPresenter = new TripHeaderPresenter({
      destinations: this.destinations,
      offers: this.offers,
      container: this.#header
    });

    this.#tripHeaderPresenter.init(this.points);
  }

  #renderSort() {
    this.#sortComponent = new SortView({
      onSortTypeChange: this.#handleSortTypeChange
    });

    render(this.#sortComponent, this.#main);
  }

  #renderPoints({resetSortType = false} = {}) {
    if (!this.points.length) {
      this.#renderNoPoints();

      if (this.tripPoints.length) {
        this.#tripHeaderPresenter.init(this.tripPoints);
      }

      return;
    }

    if (!this.#tripHeaderPresenter) {
      this.#renderTripHeader();
    } else {
      this.#tripHeaderPresenter.init(this.tripPoints);
    }

    if (!this.#sortComponent || resetSortType) {
      this.#renderSort();
    }

    render(this.#pointsListComponent, this.#main);

    this.points.forEach((it) => {
      this.#renderPoint(it);
    });
  }

  #renderPoint(point) {
    const pointPresenter = new PointPresenter({
      destinations: this.destinations,
      offers: this.offers,
      pointsContainer: this.#pointsListComponent.element,
      onDataUpdate: this.#handleViewAction,
      onModeChange: this.#handleModeChange
    });

    pointPresenter.init(point);
    this.#pointsPresenters.set(point.id, pointPresenter);
  }

  #clearPoints({resetSortType = false} = {}) {
    this.#newPointPresenter.destroy();

    this.#pointsPresenters.forEach((it) => {
      it.destroy();
    });

    this.#pointsPresenters.clear();

    if (this.#noPointsComponent) {
      remove(this.#noPointsComponent);
    }

    if (!this.tripPoints.length) {
      this.#tripHeaderPresenter.destroy();
    }

    if (this.points.length || resetSortType) {
      this.#currentSortType = SortType.DAY;
      remove(this.#sortComponent);
    }
  }
}
