import fs from "fs"
import path from "path"
import Papa from "papaparse"

async function main() {
  const currentDir = process.cwd()
  const volatilitiesDir = path.resolve(currentDir, "public/volatilities")
  const marketsCsvPath = path.resolve(currentDir, "public/setup/Markets.csv")

  console.log("Reading volatility files to collect active range bounds...")
  const boundsMap: Record<string, { firstActiveIndex: number; lastActiveIndex: number }> = {}

  const files = fs.readdirSync(volatilitiesDir).filter((file) => file.endsWith(".json"))
  for (const file of files) {
    const symbol = file.replace(/\.json$/, "").toUpperCase()
    const filePath = path.join(volatilitiesDir, file)
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"))
      if (data.firstActiveIndex != null && data.lastActiveIndex != null) {
        boundsMap[symbol] = {
          firstActiveIndex: data.firstActiveIndex,
          lastActiveIndex: data.lastActiveIndex,
        }
      }
    } catch (err) {
      console.error(`Error reading ${file}:`, err)
    }
  }

  console.log(`Loaded bounds for ${Object.keys(boundsMap).length} symbols.`)

  console.log(`Reading ${marketsCsvPath}...`)
  const csvContent = fs.readFileSync(marketsCsvPath, "utf8")
  const parsed = Papa.parse(csvContent, { header: true })

  const updatedRows = parsed.data.map((row: any) => {
    if (!row.symbol) return row
    const symbol = row.symbol.toUpperCase()
    const bounds = boundsMap[symbol]
    if (bounds) {
      row.firstActiveIndex = bounds.firstActiveIndex
      row.lastActiveIndex = bounds.lastActiveIndex
    } else {
      console.warn(`No bounds found for market symbol ${symbol}`)
      // fallback or default
      row.firstActiveIndex = ""
      row.lastActiveIndex = ""
    }
    return row
  }).filter((row: any) => row.symbol)

  console.log("Writing updated markets CSV...")
  const newCsv = Papa.unparse(updatedRows, { header: true })
  fs.writeFileSync(marketsCsvPath, newCsv)
  console.log("Successfully updated Markets.csv with active index bounds!")
}

main().catch((err) => {
  console.error("Error updating markets:", err)
  process.exit(1)
})
