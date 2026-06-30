import formatIndexAsISO from "@/utilities/formatIndexAsISO"
import lastDateOfMonth from "@/utilities/lastDateOfMonth"

export default function lastIndexOfMonth(index: number | null | undefined, dayOfWeek: string = "MON", addMonths: number = 0) {
  const currentISO = formatIndexAsISO(index ?? 0)

  const lastDay = lastDateOfMonth(currentISO, dayOfWeek, addMonths) ?? new Date("1970-01-01")

  if (lastDay != null) {
    const lastDayIndex = Math.round(lastDay.getTime() / (1000 * 60 * 60 * 24))

    return lastDayIndex
  }
}
