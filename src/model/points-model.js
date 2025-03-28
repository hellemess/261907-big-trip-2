import {DESTINATIONS, createPoint, offers} from '../mock/data.js';

const POINTS_COUNT = 3;

export default class PointsModel {
  destinations = DESTINATIONS;
  offers = offers;
  points = Array.from({length: POINTS_COUNT}, createPoint);

  getDestinations() {
    return this.destinations;
  }

  getDestinationById(id) {
    return this.destinations.find((it) => it.id === id);
  }

  getOffersByType(type) {
    return this.offers.find((it) => it.type === type).offers;
  }

  getAndFilterOffers(type, ids) {
    const typeOffers = this.offers.find((it) => it.type === type).offers;

    return typeOffers.filter((it) => ids.includes(it.id));
  }

  getPoints() {
    return this.points;
  }
}
