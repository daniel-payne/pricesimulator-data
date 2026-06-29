import db from "@/data/indexDB/db"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"

import { controller as currenciesLoadAll } from "./currenciesLoadAll"
import { controller as marketsLoadAll } from "./marketsLoadAll"
import { controller as scenariosLoadAll } from "./scenariosLoadAll"
import { controller as ohlcLoadFor } from "./ohlcLoadFor"
import { controller as ratesLoadFor } from "./ratesLoadFor"
import { controller as recalculateAll } from "./recalculateAll"
import consoleInfo from "@/utilities/consoleInfo"

export async function controller(db: PriceSimulatorDexie) {
  consoleInfo("applicationLoad: controller started")

  consoleInfo("applicationLoad: loading currencies...")
  await currenciesLoadAll(db)

  consoleInfo("applicationLoad: loading markets...")
  await marketsLoadAll(db)

  consoleInfo("applicationLoad: loading scenarios...")
  await scenariosLoadAll(db)

  consoleInfo("applicationLoad: reading all markets and scenarios from db...")
  const markets = await db.markets.toArray()
  const allSymbols = markets.map((m) => m.symbol)
  consoleInfo(`applicationLoad: found ${allSymbols.length} market(s)`)

  // Build a prioritised symbol list — scenario symbols first (in displayOrder),
  // then all remaining markets
  const scenarios = await db.scenarios.orderBy("displayOrder").toArray()
  const scenarioSymbols: string[] = []
  for (const scenario of scenarios) {
    const symbols = scenario.symbols?.split(",").map((s: string) => s.trim()).filter(Boolean) ?? []
    for (const sym of symbols) {
      if (!scenarioSymbols.includes(sym)) {
        scenarioSymbols.push(sym)
      }
    }
  }
  const remainingSymbols = allSymbols.filter((s) => !scenarioSymbols.includes(s))

  consoleInfo(`applicationLoad: priority symbols (from scenarios): ${scenarioSymbols.join(", ")}`)
  consoleInfo(`applicationLoad: remaining symbols: ${remainingSymbols.length}`)

  // 1. Load scenario symbols first — sequentially to preserve priority order
  consoleInfo("applicationLoad: loading ohlc for scenario symbols (priority)...")
  for (const symbol of scenarioSymbols) {
    await ohlcLoadFor(db, symbol, 1970)
  }

  // Run an early recalculation so scenario pages render immediately
  consoleInfo("applicationLoad: early recalculation after scenario symbols loaded...")
  await recalculateAll(db)

  // 2. Load remaining symbols in batches
  consoleInfo("applicationLoad: loading ohlc for remaining markets in batches...")
  const batchSize = 10
  for (let i = 0; i < remainingSymbols.length; i += batchSize) {
    const batch = remainingSymbols.slice(i, i + batchSize)
    await Promise.all(batch.map((symbol) => ohlcLoadFor(db, symbol, 1970)))
  }

  consoleInfo("applicationLoad: loading rates for USD...")
  await ratesLoadFor(db, "USD")

  consoleInfo("applicationLoad: final recalculation...")
  await recalculateAll(db)

  consoleInfo("applicationLoad: controller finished")
  return
}

export default function applicationLoad() {
  return controller(db)
}
