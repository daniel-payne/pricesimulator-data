import { useLiveQuery } from "dexie-react-hooks"

import db from "@/data/indexDB/db"

import type { PriceSummary } from "@/data/indexDB/types/PriceSummary"
import compareObjectsBy from "@/utilities/compareObjectsBy"

export default function usePriceSummaries(): Array<PriceSummary> | undefined {
  const priceSummaries = useLiveQuery(async () => {
    return await db.markets?.toArray() as any
  })

  return priceSummaries ? [...priceSummaries].sort(compareObjectsBy("symbol")) : undefined
}
