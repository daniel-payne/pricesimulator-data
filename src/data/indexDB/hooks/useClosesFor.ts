import { useLiveQuery } from "dexie-react-hooks"
import db from "../db"
import consoleInfo from "@/utilities/consoleInfo"
import ohlcLoadFor from "../controllers/ohlcLoadFor"

export default function useClosesFor(symbol = "MISSING") {
  const data = useLiveQuery(async () => {
    // Determine the current year of the simulation timer
    const timer = await db.timer.limit(1).first()
    const currentIndex = timer?.currentIndex

    if (currentIndex != null && symbol !== "MISSING") {
      const currentYear = new Date(currentIndex * 86400000).getUTCFullYear()
      const market = await db.markets.get(symbol)
      const loadedYears = market?.loadedYears ?? []
      
      if (market && !loadedYears.includes(currentYear)) {
        consoleInfo(`useClosesFor: lazy-loading data for ${symbol} year ${currentYear}`)
        // Trigger background load (non-blocking)
        ohlcLoadFor(symbol, currentYear)
      }
    }

    const cached = db.closesCache[symbol]

    if ((cached?.length ?? 0) > 0) {
      consoleInfo(`useClosesFor ${symbol} : cached`)
      return cached
    }

    const stored = await db.closes.where({ symbol }).first()

    db.closesCache[symbol] = stored?.data

    consoleInfo(`useClosesFor ${symbol} : stored`)
    return stored?.data
  }, [symbol])

  return data
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
