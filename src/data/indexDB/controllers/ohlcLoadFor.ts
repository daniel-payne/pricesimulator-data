import * as Papa from "papaparse"

import db from "@/data/indexDB/db"

import type { PriceSimulatorDexie } from "@/data/indexDB/db"
import marketUpdate from "./marketUpdate"
import consoleInfo from "@/utilities/consoleInfo"

const LOADING = {} as Record<string, boolean>

const csvToObjectForPrices = (item: any) => {
  if (!item["date"]) {
    return
  }

  const date = item["date"]
  const index = Math.floor(new Date(date).getTime() / 1000 / 60 / 60 / 24)

  const data = {
    date,
    index,
    open: Number.parseFloat(item["open"]),
    high: Number.parseFloat(item["high"]),
    low: Number.parseFloat(item["low"]),
    close: Number.parseFloat(item["close"]),
    volume: 0,
    interest: 0,
  } as any

  return data
}

export async function controller(db: PriceSimulatorDexie, symbol: string | undefined, year?: number) {
  const targetYear = year ?? 1970
  const loadKey = `${symbol}_${targetYear}`
  
  consoleInfo(`ohlcLoadFor: controller started for symbol = ${symbol}, year = ${targetYear}`)
  if (symbol == null) {
    consoleInfo("ohlcLoadFor: symbol is null/undefined, returning early")
    return
  }

  if (LOADING[loadKey] === true) {
    consoleInfo(`ohlcLoadFor: already loading ${loadKey}, returning early`)
    return
  }

  const market = await db.markets.get(symbol)
  consoleInfo(`ohlcLoadFor: retrieved market metadata from db for ${symbol}`)

  if (market?.symbol == null) {
    consoleInfo(`ohlcLoadFor: market symbol for ${symbol} not found in db.markets!`)
    return
  }

  const loadedYears = market.loadedYears ?? []
  if (loadedYears.includes(targetYear)) {
    consoleInfo(`ohlcLoadFor: year ${targetYear} already loaded for ${symbol}, skipping fetch`)
    
    // Ensure memory caches are populated if they are empty
    const cachedOpens = db.opensCache[symbol]
    if (cachedOpens == null) {
      const storedOpens = await db.opens.get(symbol)
      const storedHighs = await db.highs.get(symbol)
      const storedLows = await db.lows.get(symbol)
      const storedCloses = await db.closes.get(symbol)
      const storedVolatilities = await db.volatilities.get(symbol)
      
      if (storedOpens && storedHighs && storedLows && storedCloses) {
        db.opensCache[symbol] = storedOpens.data
        db.highsCache[symbol] = storedHighs.data
        db.lowsCache[symbol] = storedLows.data
        db.closesCache[symbol] = storedCloses.data
        if (storedVolatilities) {
          db.volatilitiesCache[symbol] = storedVolatilities.data
        }
      }
    }
    return
  }

  LOADING[loadKey] = true

  const symbolLower = market.symbol.toLowerCase()
  const url = `/prices/${encodeURIComponent(symbolLower)}/${encodeURIComponent(symbolLower)}_${targetYear}.csv`
  consoleInfo(`ohlcLoadFor: fetching price file from ${url}...`)
  
  let csv = ""
  try {
    const response = await fetch(url, {})
    consoleInfo(`ohlcLoadFor: fetch response status = ${response.status}, ok = ${response.ok}`)
    if (response.ok) {
      csv = await response.text()
    } else {
      consoleInfo(`ohlcLoadFor: fetch failed for ${symbol} year ${targetYear}. status text: ${response.statusText}`)
      LOADING[loadKey] = false
      return { error: response.statusText }
    }
  } catch (err) {
    console.error(`ohlcLoadFor: error fetching price file for ${symbol} year ${targetYear}:`, err)
    LOADING[loadKey] = false
    return
  }

  const json = Papa.parse(csv, { header: true })
  consoleInfo(`ohlcLoadFor: parsed csv rows count = ${json.data?.length}`)

  const prices = json.data
    .map(csvToObjectForPrices)
    .filter((item: any) => item?.open)
    .filter((item) => item.index >= 0)
  consoleInfo(`ohlcLoadFor: filtered prices count = ${prices.length}`)

  // Retrieve existing arrays from DB or initialize
  let storedOpens = await db.opens.get(symbol)
  let storedHighs = await db.highs.get(symbol)
  let storedLows = await db.lows.get(symbol)
  let storedCloses = await db.closes.get(symbol)

  if (!storedOpens) storedOpens = { symbol, data: Array(20000).fill(undefined) }
  if (!storedHighs) storedHighs = { symbol, data: Array(20000).fill(undefined) }
  if (!storedLows) storedLows = { symbol, data: Array(20000).fill(undefined) }
  if (!storedCloses) storedCloses = { symbol, data: Array(20000).fill(undefined) }

  for (const price of prices) {
    const index = price.index
    storedOpens.data[index] = price.open
    storedHighs.data[index] = price.high
    storedLows.data[index] = price.low
    storedCloses.data[index] = price.close
  }

  // Volatilities Loading & Merging (directly from the same price CSV)
  let storedVolatilities = await db.volatilities.get(symbol)
  
  if (!storedVolatilities) {
    storedVolatilities = {
      symbol,
      data: {
        firstActiveIndex: 0,
        lastActiveIndex: 20000,
        durations: {}
      }
    }
  }

  const durations = [10, 30, 90, 180]
  for (const duration of durations) {
    const durationStr = duration.toString()
    if (!storedVolatilities.data.durations[durationStr]) {
      storedVolatilities.data.durations[durationStr] = {
        overnight: Array(20000).fill(null),
        parkinson: Array(20000).fill(null),
        rogersSatchell: Array(20000).fill(null),
        garminKlass: Array(20000).fill(null),
        yangZhang: Array(20000).fill(null),
        volatility: Array(20000).fill(null),
      }
    }
  }

  // Populate volatilities for the current year
  for (const item of json.data as any[]) {
    if (!item["date"]) continue

    const date = item["date"]
    const idx = Math.floor(new Date(date).getTime() / 1000 / 60 / 60 / 24)

    if (idx >= 0 && idx < 20000) {
      for (const duration of durations) {
        const durationStr = duration.toString()
        const targetDur = storedVolatilities.data.durations[durationStr]

        const onVal = parseFloat(item[`volatilityOvernight${durationStr}`])
        const yzVal = parseFloat(item[`volatilityYangZhang${durationStr}`])

        const overnight = isNaN(onVal) ? null : onVal
        const yangZhang = isNaN(yzVal) ? null : yzVal
        const volatility = yangZhang ?? overnight ?? null

        targetDur.overnight[idx] = overnight
        targetDur.yangZhang[idx] = yangZhang
        targetDur.volatility[idx] = volatility
      }
    }
  }

  consoleInfo(`ohlcLoadFor: saving opens/highs/lows/closes/volatilities arrays to db...`)
  await db.opens.put(storedOpens)
  await db.highs.put(storedHighs)
  await db.lows.put(storedLows)
  await db.closes.put(storedCloses)
  if (storedVolatilities != null) {
    await db.volatilities.put(storedVolatilities)
  }

  // Clone cache structures to trigger React state updates
  db.opensCache[symbol] = storedOpens.data
  db.highsCache[symbol] = storedHighs.data
  db.lowsCache[symbol] = storedLows.data
  db.closesCache[symbol] = storedCloses.data
  if (storedVolatilities != null) {
    db.volatilitiesCache[symbol] = storedVolatilities.data
  }

  // Update market metadata — tighten bounds from actual loaded prices
  market.loadedYears = [...new Set([...loadedYears, targetYear])]
  const firstPriceIndex = prices[0]?.index
  const lastPriceIndex = prices[prices.length - 1]?.index
  if (firstPriceIndex != null) {
    market.firstActiveIndex =
      market.firstActiveIndex == null ? firstPriceIndex : Math.min(market.firstActiveIndex, firstPriceIndex)
  }
  if (lastPriceIndex != null) {
    market.lastActiveIndex =
      market.lastActiveIndex == null ? lastPriceIndex : Math.max(market.lastActiveIndex, lastPriceIndex)
  }
  market.priceCount = (market.priceCount ?? 0) + prices.length
  await db.markets.put(market)

  consoleInfo(`ohlcLoadFor: data loaded successfully for ${symbol} year ${targetYear}`)
  LOADING[loadKey] = false
}

export default function ohlcLoadFor(symbol: string | undefined, year?: number) {
  return controller(db, symbol, year)
}
