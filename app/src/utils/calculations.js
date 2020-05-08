import BN from 'bn.js'
import { dayjs } from './date-utils'
import { addressesEqual } from './web3-utils'

export const MONTHS_IN_A_YEAR = 12

export function totalPaidThisYear(payments, accountAddress) {
  const filter = payment => {
    const yearDiff = dayjs(payment.date).diff(dayjs(), 'years')
    return (
      addressesEqual(payment.accountAddress, accountAddress) && yearDiff === 0
    )
  }

  const totalPaid = summation(payments.filter(filter), 'denominationAmount')
  return totalPaid
}

export function summation(list, field) {
  const reducer = (acc, item) => acc.add(item[field])
  const sum = list.reduce(reducer, new BN('0'))
  return sum
}

export function splitAllocation(denominationAllocation, pctBase) {
  const PCT = new BN(100)

  const convertedDenominationAllocation = denominationAllocation.div(
    pctBase.div(PCT)
  )

  const convertedEquityAllocation = PCT.sub(convertedDenominationAllocation)

  return [convertedDenominationAllocation, convertedEquityAllocation]
}

export function convertMultiplier(multiplier, pctBase) {
  return parseInt(multiplier.div(pctBase.div(new BN(100)))) / 100
}
