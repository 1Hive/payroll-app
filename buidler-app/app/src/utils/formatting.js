import { round } from './math-utils'

const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
})

export function formatCurrency(
  amount,
  symbol,
  decimals = 10,
  pow = 18,
  multiplier = 1,
  rounding = 2,
  isIncoming = true,
  displaySign = false
) {
  const number = round(
    (amount / Math.pow(decimals, pow)) * multiplier,
    rounding
  )
  const formattedNumber = formatter.format(number)
  const sign = displaySign ? (isIncoming ? '+' : '-') : ''
  return `${sign}${formattedNumber} ${symbol}`
}
