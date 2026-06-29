import db from "@/data/indexDB/db"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"
import getTimer from "./getTimer"

import getMarketForSymbol from "./getMarketForSymbol"
import generateID from "@/utilities/generateID"
import { controller as timerStart } from "./timerStart"

import lastIndexOfMonth from "@/utilities/lastIndexOfMonth"
import { TradeStatus } from "@/data/indexDB/enums/TradeStatus"
import { TradeDirection } from "../enums/TradeDirection"

export async function controller(
  db: PriceSimulatorDexie,
  symbol: string,
  direction: TradeDirection,
  amount: number,
  entryPrice: number,
  stopLoss?: number,
  takeProfit?: number
) {
  const count = await db.trades?.count()

  const timer = await getTimer()
  // const data = await getDataForSymbol(symbol)
  const market = await getMarketForSymbol(symbol)

  const price = await db.currentPrices?.where({ symbol }).first()

  const entryIndex = timer?.currentIndex
  const expiryIndex = lastIndexOfMonth(entryIndex, "WED", 1)

  let priceModifier = market?.priceModifier ?? 1
  let priceSize = market?.priceSize ?? 1

  if (!Number.isFinite(priceModifier)) {
    priceModifier = 1
  }

  if (!Number.isFinite(priceSize)) {
    priceSize = 1
  }

  if (market != null && entryIndex != null && entryPrice != null) {
    const entryValue = ((entryPrice * priceModifier) / priceSize) * amount

    if (price != null) {
      const newContract = {
        id: generateID(),
        no: count + 1,
        status: TradeStatus.Open,
        symbol,
        amount,
        direction,
        stopLoss,
        takeProfit,
        entryValue,
        entryPrice,
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

export default function openTrade(symbol: string, direction: TradeDirection, amount: number, entryPrice: number, stopLoss?: number, takeProfit?: number) {
  return controller(db, symbol, direction, amount, entryPrice, stopLoss, takeProfit)
}
