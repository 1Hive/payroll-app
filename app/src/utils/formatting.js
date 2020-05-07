import { round } from './math-utils'
import { splitAllocation } from './calculations'

export function formatDecimals(value, digits) {
  try {
    return value.toLocaleString('en-US', {
      style: 'decimal',
      maximumFractionDigits: digits,
    })
  } catch (err) {
    if (err.name === 'RangeError') {
      // Fallback to Number.prototype.toString()
      // if the language tag is not supported.
      return value.toString()
    }
    throw err
  }
}

export function formatTokenAmount(
  amount,
  isIncoming,
  decimals = 0,
  displaySign = false,
  { rounding = 2, multiplier = 1, commas = true, replaceZeroBy = '0' } = {}
) {
  const roundedAmount = round(
    (amount / Math.pow(10, decimals)) * multiplier,
    rounding
  )
  const formattedAmount = formatDecimals(roundedAmount, 18)

  if (formattedAmount === '0') {
    return replaceZeroBy
  }

  return (
    (displaySign ? (isIncoming ? '+' : '-') : '') +
    (commas ? formattedAmount : formattedAmount.replace(',', ''))
  )
}

export function formatAllocationSplit(denominationAllocation, pctBase) {
  const [
    convertedDenominationAllocation,
    convertedEquityAllocation,
  ] = splitAllocation(denominationAllocation, pctBase)

  return `${convertedDenominationAllocation} % / ${convertedEquityAllocation} %`
}
