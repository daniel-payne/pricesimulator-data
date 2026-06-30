import db from "@/data/indexDB/db"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"
import { DEFAULT_START } from "@/data/indexDB/constants/DEFAULT_START"
import { controller as marketsLoadAll } from "./marketsLoadAll"
import { controller as scenariosLoadAll } from "./scenariosLoadAll"
import { controller as ohlcLoadFor } from "./ohlcLoadFor"
import { controller as recalculateAll } from "./recalculateAll"
import { controller as getTimer } from "./getTimer"
import consoleInfo from "@/utilities/consoleInfo"

export async function controller(db: PriceSimulatorDexie, symbols: string[]) {
  const trimmedSymbols = symbols.map((s) => s.trim()).filter(Boolean)
  if (trimmedSymbols.length === 0) {
    return
  }

  consoleInfo(`preloadScenarioPrices: loading setup data for ${trimmedSymbols.join(", ")}`)
  await scenariosLoadAll(db)
  await marketsLoadAll(db)

  const timer = await getTimer(db)
  const currentIndex = timer?.currentIndex ?? DEFAULT_START
  const year = new Date(currentIndex * 86400000).getUTCFullYear()

  // Always ensure 1970 is loaded first (baseline year), then load the current year
  // Symbols are processed in ticker (alphabetical) order
  const sortedSymbols = [...trimmedSymbols].sort((a, b) => a.localeCompare(b))

  consoleInfo(`preloadScenarioPrices: loading 1970 baseline for ${sortedSymbols.length} symbol(s) (ticker order)`)
  for (const symbol of sortedSymbols) {
    await ohlcLoadFor(db, symbol, 1970)
  }

  if (year > 1970) {
    consoleInfo(`preloadScenarioPrices: loading years 1971 to ${year} for ${sortedSymbols.length} symbol(s) (ticker order)`)
    for (let y = 1971; y <= year; y++) {
      for (const symbol of sortedSymbols) {
        await ohlcLoadFor(db, symbol, y)
      }
    }
  }

  consoleInfo("preloadScenarioPrices: recalculating prices")
  await recalculateAll(db)
}

export default function preloadScenarioPrices(symbols: string[]) {
  return controller(db, symbols)
}
