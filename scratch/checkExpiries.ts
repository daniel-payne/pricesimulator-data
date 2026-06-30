const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

function getLastDayOccurrence(date: Date, day: string) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const d = new Date(lastDay.getTime())

  if (DAYS.includes(day)) {
    const modifier = (d.getDay() + DAYS.length - DAYS.indexOf(day)) % 7 || 7
    d.setDate(d.getDate() - modifier)
  }

  return d
}

function lastDateOfMonth(currentDate: number | Date | string | null | undefined, dayOfWeek: string = "MON", addMonths: number = 0) {
  if (currentDate == null) return undefined
  const futureDate = new Date(currentDate)
  futureDate.setMonth(futureDate.getMonth() + addMonths)
  return getLastDayOccurrence(futureDate, dayOfWeek)
}

function formatIndexAsISO(index: number) {
  const epoch = index * 1000 * 60 * 60 * 24
  return new Date(epoch).toISOString().substring(0, 10)
}

function lastIndexOfMonth(index: number, dayOfWeek: string = "MON", addMonths: number = 0) {
  const currentISO = formatIndexAsISO(index)
  const lastDay = lastDateOfMonth(currentISO, dayOfWeek, addMonths)
  if (lastDay != null) {
    return Math.floor(lastDay.getTime() / (1000 * 60 * 60 * 24))
  }
  return 0
}

// Test for all days between index 500 (1971) and 20000 (2024)
let minDuration = Infinity
let minIndex = -1
let minDate = ""
let minExpiryDate = ""

for (let index = 500; index < 20000; index++) {
  const expiryIndex = lastIndexOfMonth(index, "WED", 1)
  const duration = expiryIndex - index
  
  if (duration < minDuration) {
    minDuration = duration
    minIndex = index
    minDate = formatIndexAsISO(index)
    minExpiryDate = formatIndexAsISO(expiryIndex)
  }
}

console.log(`Min duration: ${minDuration} days`)
console.log(`At index: ${minIndex} (${minDate})`)
console.log(`Expiry: ${minExpiryDate}`)
