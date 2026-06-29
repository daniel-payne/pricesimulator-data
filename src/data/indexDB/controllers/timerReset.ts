import db from "../db"

import timerUpdate from "./timerUpdate"

import type { PriceSimulatorDexie } from "../db"
import { controller as recalculateAll } from "./recalculateAll"
import { DEFAULT_START } from "../constants/DEFAULT_START"

export async function controller(db: PriceSimulatorDexie, day?: string) {
  if (db.timeout != null) {
    window.clearTimeout(db.timeout)
  }

  let currentIndex = DEFAULT_START

  if (day != null) {
    const currentDate = new Date(day)
    const currentEpoch = currentDate.getTime()
    currentIndex = Math.floor(currentEpoch / 1000 / 60 / 60 / 24)
  }

  await timerUpdate({ isTimerActive: false, currentIndex, activeSymbols: undefined })

  await recalculateAll(db)
}

export default function timerReset(day?: string) {
  return controller(db, day)
}
