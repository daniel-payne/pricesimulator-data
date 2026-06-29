import db from "@/data/indexDB/db"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"

const CACHE: Record<string, any> = {}

export async function controller(db: PriceSimulatorDexie, symbol: string) {
  if (CACHE[symbol] != null) {
    return CACHE[symbol]
  }

  const highs = await db.highs.get(symbol)

  CACHE[symbol] = highs?.data

  return highs?.data
}

export default function getMarketHighValuesForSymbol(symbol: string) {
  return controller(db, symbol)
}
