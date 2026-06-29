import { useLiveQuery } from "dexie-react-hooks"

import db from "@/data/indexDB/db"

import compareObjectsBy from "@/utilities/compareObjectsBy"

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function useMarkets() {
  const markets = useLiveQuery(async () => {
    return await db.markets?.toArray()
  })

  return markets ? [...markets].sort(compareObjectsBy("name")) : undefined
}
