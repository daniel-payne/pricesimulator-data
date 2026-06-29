import fs from "fs"
import path from "path"

const DURATIONS = [10, 30, 90, 180]
const GARMIN_KLASS_FACTOR = 3 * Math.log(2) - 1
const PARKINSON_FACTOR = 1 / Math.sqrt(4 * Math.log(2))

interface PriceRow {
  dateStr: string      // YYYYMMDD
  dateFormatted: string // YYYY-MM-DD
  epochDay: number
  open: number
  high: number
  low: number
  close: number
}

// Timezone-safe epoch day calculation
function getEpochDay(dateStr: string): number {
  const year = parseInt(dateStr.substring(0, 4), 10)
  const month = parseInt(dateStr.substring(4, 6), 10)
  const day = parseInt(dateStr.substring(6, 8), 10)
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

function average(array: (number | undefined)[]): number | undefined {
  const data = array.filter((i): i is number => i != null)
  if (data.length === 0) {
    return undefined
  }
  return data.reduce((p, c) => p + c, 0) / array.length
}

function standardDeviation(array: (number | undefined)[]): number | undefined {
  const data = array.filter((i): i is number => i != null)
  if (data.length < 2) {
    return undefined
  }
  const n = data.length
  const mean = data.reduce((a, b) => a + b) / n
  return Math.sqrt(data.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (n - 1))
}

async function processFile(filePath: string, outputDir: string) {
  const filename = path.basename(filePath)
  const ticker = filename.replace(/\.txt$/, "").toLowerCase()
  console.log(`Processing file: ${filename} (ticker: ${ticker})`)

  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split(/\r?\n/)
  if (lines.length <= 1) {
    console.warn(`File ${filename} is empty or has only header.`)
    return
  }

  // Parse lines
  const rows: PriceRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parts = line.split(",")
    if (parts.length < 8) continue

    const dateStr = parts[2]
    if (!dateStr || dateStr.length !== 8) continue

    const open = parseFloat(parts[4])
    const high = parseFloat(parts[5])
    const low = parseFloat(parts[6])
    const close = parseFloat(parts[7])

    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue

    const dateFormatted = dateStr.substring(0, 4) + "-" + dateStr.substring(4, 6) + "-" + dateStr.substring(6, 8)
    const epochDay = getEpochDay(dateStr)

    rows.push({
      dateStr,
      dateFormatted,
      epochDay,
      open,
      high,
      low,
      close,
    })
  }

  if (rows.length === 0) {
    console.warn(`No valid rows parsed for ${filename}`)
    return
  }

  // Sort rows chronologically
  rows.sort((a, b) => a.epochDay - b.epochDay)

  const minEpochDay = rows[0].epochDay
  const maxEpochDay = rows[rows.length - 1].epochDay
  const length = maxEpochDay - minEpochDay + 1

  // Map elements to day-indexed calendar arrays (to correctly search back for previous close gaps)
  const opens = Array(length).fill(undefined)
  const highs = Array(length).fill(undefined)
  const lows = Array(length).fill(undefined)
  const closes = Array(length).fill(undefined)

  for (const row of rows) {
    const idx = row.epochDay - minEpochDay
    opens[idx] = row.open
    highs[idx] = row.high
    lows[idx] = row.low
    closes[idx] = row.close
  }

  // Pre-calculate variances and log return ratios
  const averageOpenCloses = Array(length).fill(undefined)
  const percentageCloseYesterdays = Array(length).fill(undefined)
  const logSquaredHighLows = Array(length).fill(undefined)
  const logOpenYesterdays = Array(length).fill(undefined)
  const logHighOpens = Array(length).fill(undefined)
  const logLowOpens = Array(length).fill(undefined)
  const logCloseOpens = Array(length).fill(undefined)
  const rogersSatchellValues = Array(length).fill(undefined)

  for (let i = 0; i < length; i++) {
    const open = opens[i]
    const high = highs[i]
    const low = lows[i]
    const close = closes[i]

    if (open != null) {
      averageOpenCloses[i] = (open + close) / 2
      logSquaredHighLows[i] = Math.log(high / low) ** 2
      logHighOpens[i] = Math.log(high / open)
      logLowOpens[i] = Math.log(low / open)
      logCloseOpens[i] = Math.log(close / open)

      rogersSatchellValues[i] = logHighOpens[i] * (logHighOpens[i] - logCloseOpens[i]) + logLowOpens[i] * (logLowOpens[i] - logCloseOpens[i])

      if (i > 0) {
        let lastClose = undefined
        for (let j = i - 1; j >= 0; j--) {
          if (closes[j] != null) {
            lastClose = closes[j]
            break
          }
        }

        if (close != null && lastClose != null) {
          percentageCloseYesterdays[i] = close / lastClose - 1
        }

        if (open != null && lastClose != null) {
          logOpenYesterdays[i] = Math.log(open / lastClose)
        }
      }
    }
  }

  // Map to store calculated volatilities for each parsed row
  const rowVolatilities = new Map<number, Record<string, string>>()

  for (const row of rows) {
    const idx = row.epochDay - minEpochDay
    const v: Record<string, string> = {}

    for (const duration of DURATIONS) {
      // Slices from idx - duration to idx (excl idx)
      if (idx > duration + 1 && averageOpenCloses[idx] != null) {
        const percentageCloseYesterdaysSlice = percentageCloseYesterdays.slice(idx - duration, idx)
        const logSquaredHighLowsSlice = logSquaredHighLows.slice(idx - duration, idx)
        const logOpenYesterdaysSlice = logOpenYesterdays.slice(idx - duration, idx)
        const logCloseOpensSlice = logCloseOpens.slice(idx - duration, idx)
        const rogersSatchellValuesSlice = rogersSatchellValues.slice(idx - duration, idx)

        const avgRogersSatchell = average(rogersSatchellValuesSlice)
        const stdPercentageCloseYesterdays = standardDeviation(percentageCloseYesterdaysSlice)
        const stdLogOpenYesterdays = standardDeviation(logOpenYesterdaysSlice)
        const stdLogCloseOpens = standardDeviation(logCloseOpensSlice)

        if (stdPercentageCloseYesterdays != null) {
          const val = stdPercentageCloseYesterdays * Math.sqrt(365 / duration)
          v[`volatilityOvernight${duration}`] = val.toFixed(4)
        } else {
          v[`volatilityOvernight${duration}`] = ""
        }

        if (stdLogOpenYesterdays != null && stdLogCloseOpens != null && avgRogersSatchell != null) {
          const yangZhangFactor = 0.34 / (1.34 + (duration + 1) / (duration - 1))
          const rogersSatchell = Math.sqrt(avgRogersSatchell)
          const val = Math.sqrt(
            stdLogOpenYesterdays ** 2 +
            (yangZhangFactor * stdLogCloseOpens) ** 2 +
            (1 - yangZhangFactor) * rogersSatchell ** 2
          ) * Math.sqrt(365 / duration)
          v[`volatilityYangZhang${duration}`] = val.toFixed(4)
        } else {
          v[`volatilityYangZhang${duration}`] = ""
        }
      } else {
        v[`volatilityOvernight${duration}`] = ""
        v[`volatilityYangZhang${duration}`] = ""
      }
    }
    rowVolatilities.set(row.epochDay, v)
  }

  // Group by year
  // Key: YYYY
  const groups = new Map<string, PriceRow[]>()
  for (const row of rows) {
    const year = row.dateStr.substring(0, 4)
    if (!groups.has(year)) {
      groups.set(year, [])
    }
    groups.get(year)!.push(row)
  }

  // Create symbol directory
  const tickerDir = path.join(outputDir, ticker)
  if (!fs.existsSync(tickerDir)) {
    fs.mkdirSync(tickerDir, { recursive: true })
  }

  // Write CSV for each group
  const headers = [
    "date", "open", "high", "low", "close",
    "volatilityOvernight10", "volatilityOvernight30", "volatilityOvernight90", "volatilityOvernight180",
    "volatilityYangZhang10", "volatilityYangZhang30", "volatilityYangZhang90", "volatilityYangZhang180"
  ].join(",")

  for (const [year, groupRows] of groups.entries()) {
    const csvLines = [headers]

    for (const row of groupRows) {
      const v = rowVolatilities.get(row.epochDay) || {}
      const line = [
        row.dateFormatted,
        row.open.toString(),
        row.high.toString(),
        row.low.toString(),
        row.close.toString(),
        v["volatilityOvernight10"] || "",
        v["volatilityOvernight30"] || "",
        v["volatilityOvernight90"] || "",
        v["volatilityOvernight180"] || "",
        v["volatilityYangZhang10"] || "",
        v["volatilityYangZhang30"] || "",
        v["volatilityYangZhang90"] || "",
        v["volatilityYangZhang180"] || ""
      ].join(",")
      csvLines.push(line)
    }

    const csvContent = csvLines.join("\n") + "\n"
    const outputFilePath = path.join(tickerDir, `${ticker}_${year}.csv`)
    fs.writeFileSync(outputFilePath, csvContent)
  }
}

async function main() {
  const ohlcDir = path.resolve(process.cwd(), "public/ohlc")
  const outputPricesDir = path.resolve(process.cwd(), "public/prices")

  if (!fs.existsSync(outputPricesDir)) {
    fs.mkdirSync(outputPricesDir, { recursive: true })
  }

  const files = fs.readdirSync(ohlcDir).filter((file) => file.endsWith(".txt"))
  console.log(`Found ${files.length} OHLC files in ${ohlcDir}`)

  for (const file of files) {
    const filePath = path.join(ohlcDir, file)
    await processFile(filePath, outputPricesDir)
  }

  console.log("All price data yearly files generated successfully!")
}

main().catch((err) => {
  console.error("Error building price data yearly files:", err)
  process.exit(1)
})
