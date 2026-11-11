import type { GarageCar, MemberCard, TradeRow } from "./api";
import type { TrumpCardData } from "./components/TrumpCard";

export function tradeOfferCar(trade: TradeRow): TrumpCardData {
  return {
    make: trade.offerMake,
    model: trade.offerModel,
    trimName: trade.offerTrimName,
    bodyType: trade.offerBodyType,
    colour: trade.offerColour,
    year: trade.offerYear,
  };
}

export function tradeRequestCar(trade: TradeRow): TrumpCardData {
  return {
    make: trade.requestMake,
    model: trade.requestModel,
    trimName: trade.requestTrimName,
    bodyType: trade.requestBodyType,
    colour: trade.requestColour,
    year: trade.requestYear,
  };
}

export function garageToTrumpCard(car: GarageCar): TrumpCardData {
  return {
    make: car.make,
    model: car.model,
    trimName: car.trimName,
    bodyType: car.bodyType,
    colour: car.colour,
    year: car.year,
    bhp: car.bhp,
    topSpeedMph: car.topSpeedMph,
    zeroToSixtySecs: car.zeroToSixtySecs,
  };
}

export function memberCardToTrumpCard(card: MemberCard): TrumpCardData {
  return {
    make: card.make,
    model: card.model,
    trimName: card.trimName,
    bodyType: card.bodyType,
    colour: card.colour,
    year: card.year,
    bhp: card.bhp,
    topSpeedMph: card.topSpeedMph,
    zeroToSixtySecs: card.zeroToSixtySecs,
  };
}
