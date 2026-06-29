import { useLiveQuery } from "dexie-react-hooks"

import db from "@/data/indexDB/db"
import useTimer from "./useTimer"
import compareObjectsBy from "@/utilities/compareObjectsBy"

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function useActiveSymbols() {
  const markets = useLiveQuery(async () => {
    return await db.markets?.toArray()
  })

  const timer = useTimer()

  const { currentIndex } = timer

  const sortedMarkets = markets ? [...markets].sort(compareObjectsBy("name")) : undefined

  if (currentIndex != null) {
    const activeMarkets = sortedMarkets?.filter((symbol) => symbol.firstActiveIndex <= currentIndex)

    const symbols = activeMarkets?.map((market) => market.symbol)

    // symbols?.sort()

    return symbols
  }
}
