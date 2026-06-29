import { useLiveQuery } from "dexie-react-hooks"

import db from "@/data/indexDB/db"

import compareObjectsBy from "@/utilities/compareObjectsBy"

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function useScenarioData() {
  const scenarios = useLiveQuery(async () => {
    return await db.scenarios?.toArray()
  })

  return scenarios ? [...scenarios].sort(compareObjectsBy("displayOrder")) : undefined
}
