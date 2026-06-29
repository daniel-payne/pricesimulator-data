import db from "@/data/indexDB/db"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"
import type { PriceSummary } from "../types/PriceSummary"

const CACHE: Record<string, any> = {}

export async function controller(db: PriceSimulatorDexie, symbol: string): Promise<PriceSummary | undefined> {
  if (CACHE[symbol] != null) {
    return CACHE[symbol]
  }

  const priceSummary = await db.markets.get(symbol)

  CACHE[symbol] = priceSummary

  return priceSummary as unknown as PriceSummary
}

export default function getPriceSummaryForSymbol(symbol: string) {
  return controller(db, symbol)
}
