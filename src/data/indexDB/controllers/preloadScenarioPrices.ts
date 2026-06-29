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

  consoleInfo(`preloadScenarioPrices: loading year ${year} for ${trimmedSymbols.length} symbol(s)`)
  for (const symbol of trimmedSymbols) {
    await ohlcLoadFor(db, symbol, year)
  }

  consoleInfo("preloadScenarioPrices: recalculating prices")
  await recalculateAll(db)
}

export default function preloadScenarioPrices(symbols: string[]) {
  return controller(db, symbols)
}
