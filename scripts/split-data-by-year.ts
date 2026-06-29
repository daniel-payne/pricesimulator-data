import fs from "fs"
import path from "path"
import Papa from "papaparse"

const VOLATILITY_DURATIONS = [10, 30, 90, 180, 360]

const csvToObjectForPrices = (item: any) => {
  if (!item["<DATE>"]) {
    return null
  }

  const dateStr = item["<DATE>"]
  const year = parseInt(dateStr.substring(0, 4), 10)
  const date = dateStr.substring(0, 4) + "-" + dateStr.substring(4, 6) + "-" + dateStr.substring(6, 8)
  const index = Math.floor(new Date(date).getTime() / 1000 / 60 / 60 / 24)

  return {
    rawRow: item,
    year,
    index,
    open: Number.parseFloat(item["<OPEN>"]),
  }
}

async function splitPriceFile(filePath: string, outputPricesDir: string) {
  const fileName = path.basename(filePath)
  const symbol = fileName.replace(/\.txt$/, "").toUpperCase()
  console.log(`Splitting prices for ${symbol}...`)

  const csv = fs.readFileSync(filePath, "utf8")
  const json = Papa.parse(csv, { header: true })

  // Group CSV raw rows by year
  const rowsByYear: Record<number, string[]> = {}
  
  // PapaParse json.data
  for (const item of json.data) {
    const parsed = csvToObjectForPrices(item)
    if (!parsed || isNaN(parsed.open) || parsed.index < 0) continue

    if (!rowsByYear[parsed.year]) {
      rowsByYear[parsed.year] = []
    }
    // Convert row back to CSV line matching PapaParse's parser
    const line = Papa.unparse([parsed.rawRow], { header: false })
    rowsByYear[parsed.year].push(line)
  }

  // Write yearly CSV files
  const symbolDir = path.join(outputPricesDir, symbol.toLowerCase())
  if (!fs.existsSync(symbolDir)) {
    fs.mkdirSync(symbolDir, { recursive: true })
  }

  const header = "<TICKER>,<PER>,<DATE>,<TIME>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOL>,<OPENINT>"
  for (const [year, lines] of Object.entries(rowsByYear)) {
    const content = [header, ...lines].join("\n") + "\n"
    fs.writeFileSync(path.join(symbolDir, `${year}.txt`), content)
  }
}

async function splitVolatilityFile(filePath: string, outputVolatilitiesDir: string) {
  const fileName = path.basename(filePath)
  const symbol = fileName.replace(/\.json$/, "").toUpperCase()
  console.log(`Splitting volatilities for ${symbol}...`)

  const rawJSON = fs.readFileSync(filePath, "utf8")
  const parentData = JSON.parse(rawJSON)

  const firstActiveIndex = parentData.firstActiveIndex
  const lastActiveIndex = parentData.lastActiveIndex
  const durations = parentData.durations

  if (firstActiveIndex == null || lastActiveIndex == null) {
    console.warn(`No active range for ${symbol}`)
    return
  }

  // Group indices by year
  const indicesByYear: Record<number, number[]> = {}
  for (let index = firstActiveIndex; index <= lastActiveIndex; index++) {
    const date = new Date(index * 86400000)
    const year = date.getUTCFullYear()
    if (!indicesByYear[year]) {
      indicesByYear[year] = []
    }
    indicesByYear[year].push(index)
  }

  const symbolDir = path.join(outputVolatilitiesDir, symbol.toLowerCase())
  if (!fs.existsSync(symbolDir)) {
    fs.mkdirSync(symbolDir, { recursive: true })
  }

  for (const [yearStr, indices] of Object.entries(indicesByYear)) {
    const year = parseInt(yearStr, 10)
    const yearFirstIndex = indices[0]
    const yearLastIndex = indices[indices.length - 1]

    const yearDurations: Record<string, any> = {}

    for (const duration of VOLATILITY_DURATIONS) {
      const durStr = duration.toString()
      const parentDur = durations[durStr]
      if (!parentDur) continue

      const sliceStart = yearFirstIndex - firstActiveIndex
      const sliceEnd = yearLastIndex - firstActiveIndex

      const sliceArray = (arr: any[]) => {
        if (!arr) return []
        return arr.slice(sliceStart, sliceEnd + 1)
      }

      yearDurations[durStr] = {
        overnight: sliceArray(parentDur.overnight),
        parkinson: sliceArray(parentDur.parkinson),
        rogersSatchell: sliceArray(parentDur.rogersSatchell),
        garminKlass: sliceArray(parentDur.garminKlass),
        yangZhang: sliceArray(parentDur.yangZhang),
        volatility: sliceArray(parentDur.volatility),
      }
    }

    const yearlyData = {
      symbol,
      year,
      firstActiveIndex: yearFirstIndex,
      lastActiveIndex: yearLastIndex,
      overallFirstActiveIndex: firstActiveIndex,
      overallLastActiveIndex: lastActiveIndex,
      durations: yearDurations
    }

    fs.writeFileSync(path.join(symbolDir, `${year}.json`), JSON.stringify(yearlyData))
  }
}

async function main() {
  const currentDir = process.cwd()
  const pricesDir = path.resolve(currentDir, "public/prices")
  const volatilitiesDir = path.resolve(currentDir, "public/volatilities")

  const priceFiles = fs.readdirSync(pricesDir).filter((file) => file.endsWith(".txt"))
  console.log(`Found ${priceFiles.length} price files to split.`)
  for (const file of priceFiles) {
    const filePath = path.join(pricesDir, file)
    await splitPriceFile(filePath, pricesDir)
  }

  const volatilityFiles = fs.readdirSync(volatilitiesDir).filter((file) => file.endsWith(".json"))
  console.log(`Found ${volatilityFiles.length} volatility files to split.`)
  for (const file of volatilityFiles) {
    const filePath = path.join(volatilitiesDir, file)
    await splitVolatilityFile(filePath, volatilitiesDir)
  }

  console.log("Splitting completed successfully!")
}

main().catch((err) => {
  console.error("Error splitting:", err)
  process.exit(1)
})
