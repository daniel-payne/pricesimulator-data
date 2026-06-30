// import { SymbolData } from "../types/SymbolData"
// import { useEffect, useState } from "react"

// import getMarketLowsValuesForSymbol from "../controllers/getMarketLowValuesForSymbol"

// export default function useMarketLowsForSymbol(symbol: string | undefined | null = "NO-MATCH"): SymbolData | undefined {
//   const [data, setData] = useState<SymbolData | undefined>(undefined)

//   useEffect(() => {
//     const run = async () => {
//       if (symbol != null) {
//         const data = await getMarketLowsValuesForSymbol(symbol)

//         if (data != null) {
//           setData(data)
//         }
//       }
//     }

//     run()
//   }, [symbol])

//   return data
// }

import { useLiveQuery } from "dexie-react-hooks"

import db from "@/data/indexDB/db"
import { SymbolData } from "../types/SymbolData"

const CACHE = {} as Record<string, SymbolData>

export default function useMarketLowsForSymbol(symbol: string | undefined | null = "NO-MATCH"): SymbolData | undefined {
  const market = useLiveQuery(async () => {
    const result = await db.marketLows?.where({ symbol }).first()

    if (symbol != null && result != null) {
      CACHE[symbol] = result
    }

    return result
  }, [symbol])

  return market
}
