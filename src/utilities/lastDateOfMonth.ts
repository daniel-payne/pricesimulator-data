const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

function getLastDayOccurrence(date: Date, day: string) {
  // Create a UTC Date representing the last day of the month
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))

  const d = new Date(lastDay.getTime())

  if (DAYS.includes(day)) {
    const targetIndex = DAYS.indexOf(day)
    const modifier = (d.getUTCDay() + 7 - targetIndex) % 7
    d.setUTCDate(d.getUTCDate() - modifier)
  }

  return d
}

export default function lastDateOfMonth(currentDate: number | Date | string | null | undefined, dayOfWeek: string = "MON", addMonths: number = 0) {
  if (currentDate == null) {
    return undefined
  }

  let futureDate: Date
  if (typeof currentDate === "number") {
    futureDate = new Date(currentDate * 86400000)
  } else if (typeof currentDate === "string") {
    futureDate = new Date(currentDate)
  } else {
    futureDate = new Date(currentDate.getTime())
  }

  // Set day to 1 before adding months to prevent date overflow (e.g. Jan 31 + 1 month skipping to March)
  futureDate.setUTCDate(1)
  futureDate.setUTCMonth(futureDate.getUTCMonth() + addMonths)

  return getLastDayOccurrence(futureDate, dayOfWeek)
}
