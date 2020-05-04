import { round } from './math-utils'
import BN from 'bn.js'

export function formatDecimals(value, digits) {
  try {
    return value.toLocaleString('latn', {
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
  { rounding = 2, multiplier = 1 } = {}
) {
  const roundedAmount = round(
    (amount / Math.pow(10, decimals)) * multiplier,
    rounding
  )

  return (
    (displaySign ? (isIncoming ? '+' : '-') : '') +
    formatDecimals(roundedAmount, 18)
  )
}

export function splitAllocation(denominationAllocation, pctBase) {
  const PCT = new BN(100)

  const convertedDenominationAllocation = denominationAllocation.div(
    pctBase.div(PCT)
  )

  const convertedEquityAllocation = PCT.sub(convertedDenominationAllocation)

  return `${convertedDenominationAllocation} % / ${convertedEquityAllocation} %`
}
