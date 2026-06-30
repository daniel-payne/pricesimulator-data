import lastIndexOfMonth from "../src/utilities/lastIndexOfMonth"
import formatIndexAsISO from "../src/utilities/formatIndexAsISO"

let minDuration = Infinity
let minIndex = -1
let minDate = ""
let minExpiryDate = ""

for (let index = 500; index < 20000; index++) {
  const expiryIndex = lastIndexOfMonth(index, "WED", 1)
  if (expiryIndex == null) continue
  const duration = expiryIndex - index
  
  if (duration < minDuration) {
    minDuration = duration
    minIndex = index
    minDate = formatIndexAsISO(index) ?? ""
    minExpiryDate = formatIndexAsISO(expiryIndex) ?? ""
  }
}

console.log(`Min duration: ${minDuration} days`)
console.log(`At index: ${minIndex} (${minDate})`)
console.log(`Expiry: ${minExpiryDate}`)
