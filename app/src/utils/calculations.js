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

export function secondsToMonths(seconds) {
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24
  const months = days / 30
  return Math.round(months)
}
