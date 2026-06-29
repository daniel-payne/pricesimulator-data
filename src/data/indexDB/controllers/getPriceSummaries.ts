import db from "@/data/indexDB/db"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"
import type { PriceSummary } from "../types/PriceSummary"

export async function controller(db: PriceSimulatorDexie): Promise<PriceSummary[]> {
  const priceSummaries = await db.markets.toArray()

  return priceSummaries as unknown as PriceSummary[]
}

export default function getPriceSummaries() {
  return controller(db)
}
