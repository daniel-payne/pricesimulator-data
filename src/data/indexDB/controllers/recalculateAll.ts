import db from "@/data/indexDB/db"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"
import { controller as recalculateCurrentBalance } from "./recalculateCurrentBalance"
import { controller as recalculateCurrentPrices } from "./recalculateCurrentPrices"
import { controller as recalculateCurrentRates } from "./recalculateCurrentRates"
import { controller as recalculateCurrentMargins } from "./recalculateCurrentMargins"
import { controller as recalculateCurrentVolatilities } from "./recalculateCurrentVolatilities"
import { controller as getTimer } from "./getTimer"
import { controller as ohlcLoadFor } from "./ohlcLoadFor"

import closeAllTrades from "./closeAllTrades"
import closeExpiringTrades from "./closeExpiringTrades"

export async function controller(db: PriceSimulatorDexie) {
  const timer = await getTimer(db)
  const currentIndex = timer?.currentIndex

  if (currentIndex != null) {
    const currentYear = new Date(currentIndex * 86400000).getUTCFullYear()
    const activeSymbols = timer.activeSymbols ?? []
    for (const symbol of activeSymbols) {
      let market = await db.markets.get(symbol)
      if (!market) continue

      for (let y = 1970; y <= currentYear; y++) {
        const loadedYears = market?.loadedYears ?? []
        if (!loadedYears.includes(y)) {
          await ohlcLoadFor(db, symbol, y)
          // Refresh local reference after loading a year to get updated loadedYears
          market = await db.markets.get(symbol)
        }
      }
    }
  }

  await recalculateCurrentPrices(db)
  await recalculateCurrentVolatilities(db)
  await recalculateCurrentRates(db)
  await recalculateCurrentMargins(db)

  const newBalance = await recalculateCurrentBalance(db)

  if (newBalance.availableBalance < 250) {
    await closeAllTrades()
    return
  }

  await closeExpiringTrades()
  // await executeExpiringOptions()

  return
}

export default function recalculateAll() {
  return controller(db)
}
