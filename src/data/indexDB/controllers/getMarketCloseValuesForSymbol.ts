import db from "@/data/indexDB/db"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"

const CACHE: Record<string, any> = {}

export async function controller(db: PriceSimulatorDexie, symbol: string) {
  if (CACHE[symbol] != null) {
    return CACHE[symbol]
  }

  const closes = await db.closes.get(symbol)

  CACHE[symbol] = closes?.data

  return closes?.data
}

export default function getMarketCloseValuesForSymbol(symbol: string) {
  return controller(db, symbol)
}
