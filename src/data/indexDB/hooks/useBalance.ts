import { useLiveQuery } from "dexie-react-hooks"

import db from "@/data/indexDB/db"
import balanceCalculate from "../controllers/balanceCalculate"

export default function useBalance(): any | undefined {
  const balance = useLiveQuery(async () => {
    return await balanceCalculate()
  })

  return balance ?? {}
}
