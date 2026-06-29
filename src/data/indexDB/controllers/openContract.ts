import db from "@/data/indexDB/db"

import closeContract from "./closeTrade"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"
import getTimer from "./getTimer"

import getMarketForSymbol from "./getMarketForSymbol"
import generateID from "@/utilities/generateID"
import { controller as timerStart } from "./timerStart"

import { DEFAULT_CONTRACT_COST } from "../constants/DEFAULT_CONTRACT_COST"

import { TradeStatus } from "@/data/indexDB/enums/TradeStatus"
import { TradeDirection } from "../enums/TradeDirection"
import lastIndexOfMonth from "@/utilities/lastIndexOfMonth"

export async function controller(db: PriceSimulatorDexie, symbol: string, direction: TradeDirection, size: number) {
  const count = await db.trades?.count()
  const activeTrades = await db.trades?.where({ symbol, status: TradeStatus.Open }).toArray()

  for (const trade of activeTrades) {
    await closeContract(trade.id)
  }

  const timer = await getTimer()
  // const data = await getDataForSymbol(symbol)
  const market = await getMarketForSymbol(symbol)

  const price = await db.currentPrices?.where({ symbol }).first()

  const entryIndex = timer?.currentIndex
  const expiryIndex = lastIndexOfMonth(entryIndex, "WED", 1)

  let entryPrice
  let entryCost

  let priceModifier = market?.priceModifier != null ? +market.priceModifier : 1
  let priceSize = market?.priceSize != null ? +market.priceSize : 1

  if (!Number.isFinite(priceModifier)) {
    priceModifier = 1
  }

  if (!Number.isFinite(priceSize)) {
    priceSize = 1
  }

  if (size != null) {
    if (price?.isMarketClosed) {
      entryPrice = price?.nextOpen
    } else {
      entryPrice = price?.currentClose
    }

    entryCost = DEFAULT_CONTRACT_COST * size
  } else {
    if (price?.isMarketClosed) {
      entryPrice = direction === TradeDirection.Call ? price?.nextAsk : price?.nextBid
    } else {
      entryPrice = direction === TradeDirection.Call ? price?.currentAsk : price?.currentBid
    }
  }

  if (market != null && entryIndex != null && entryPrice != null) {
    const amount = size * market?.contractSize

    const entryValue = ((entryPrice * priceModifier) / priceSize) * amount

    if (price != null) {
      const newContract = {
        id: generateID(),
        no: count + 1,
        status: TradeStatus.Open,
        symbol,
        amount,
        direction,
        size,
        entryValue,
        entryPrice,
        entryCost,
        entryIndex,
        exitPrice: undefined,
        exitValue: undefined,
        exitCost: undefined,
        exitTimestamp: undefined,
        expiryIndex,
        profit: undefined,
      }

      await db.trades?.put(newContract)
      await timerStart(db)

      return newContract
    }
  }

  return undefined
}

export default function openContract(symbol: string, direction: TradeDirection, size: number) {
  return controller(db, symbol, direction, size)
}
