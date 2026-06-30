import { DEFAULT_SPREAD } from "../constants/DEFAULT_SPREAD"
import { Price } from "../types/Price"

// import formatIndexAsDate from "@/utilities/formatIndexAsDate"
// import formatIndexAsISO from "@/utilities/formatIndexISO"
// import formatIndexAsDay from "@/utilities/formatIndexDay"

import type { PriceSummary } from "../types/PriceSummary"

export default function extractPriceForIndex(
  currentIndex: number,

  opens: Array<number>,
  highs: Array<number>,
  lows: Array<number>,
  closes: Array<number>,

  priceSummary: PriceSummary,

  spread: number = DEFAULT_SPREAD
) {
  if (opens == null || highs == null || lows == null || closes == null) {
    return
  }

  const indexEnd = opens.length - 1

  if (currentIndex > indexEnd) {
    return
  }

  if (priceSummary.firstActiveIndex == null) {
    return
  }

  const symbol = priceSummary.symbol

  const isMarketActive = priceSummary.firstActiveIndex <= currentIndex
  const isMarketClosed = closes[currentIndex] == null

  if (isMarketActive === false) {
    return
  }

  let priorIndex
  let priorOpen
  let priorClose
  let priorClosingBid
  let priorClosingAsk

  let currentOpen
  let currentHigh
  let currentLow
  let currentClose
  let currentBid
  let currentAsk
  let currentMidRangePrice
  let currentMidDayPrice
  let currentClosingBid
  let currentClosingAsk

  let nextIndex
  let nextOpen
  let nextOpeningBid
  let nextOpeningAsk

  let hasIntraDayPrices

  for (let searchIndex = currentIndex - 1; searchIndex >= 0; searchIndex--) {
    const close = closes[searchIndex]

    if (close != null) {
      priorIndex = searchIndex

      priorOpen = opens[priorIndex]
      priorClose = closes[priorIndex]

      priorClosingAsk = priorClose * (1 + spread)
      priorClosingBid = priorClose * (1 - spread)

      break
    }
  }

  for (let searchIndex = currentIndex + 1; searchIndex <= indexEnd; searchIndex++) {
    const close = closes[searchIndex]

    if (close != null) {
      nextIndex = searchIndex

      nextOpen = opens[nextIndex]

      nextOpeningAsk = nextOpen * (1 + spread)
      nextOpeningBid = nextOpen * (1 - spread)

      break
    }
  }

  if (isMarketClosed === false) {
    currentOpen = opens[currentIndex]
    currentClose = closes[currentIndex]
    currentHigh = highs[currentIndex]
    currentLow = lows[currentIndex]

    currentMidRangePrice = Math.random() * (currentHigh - currentLow) + currentLow
    currentMidDayPrice = Math.random() * Math.abs(currentOpen - currentClose) + Math.min(currentOpen, currentClose)

    currentAsk = ((3 * currentMidRangePrice + 1 * currentMidDayPrice) / 4) * (1 + spread)
    currentBid = ((3 * currentMidRangePrice + 1 * currentMidDayPrice) / 4) * (1 - spread)

    currentClosingAsk = currentClose * (1 + spread)
    currentClosingBid = currentClose * (1 - spread)

    hasIntraDayPrices = !(currentOpen === currentClose && currentHigh === currentLow)
  }

  const price = {
    symbol,

    currentIndex,

    isMarketActive,
    isMarketClosed,

    currentOpen,
    currentHigh,
    currentLow,
    currentClose,
    currentMidRangePrice,
    currentMidDayPrice,
    currentBid,
    currentAsk,
    currentClosingAsk,
    currentClosingBid,

    priorIndex,
    priorOpen,
    priorClose,
    priorClosingBid,
    priorClosingAsk,

    nextIndex,
    nextOpen,
    nextOpeningBid,
    nextOpeningAsk,

    hasIntraDayPrices,
  } as Price

  return price
}
