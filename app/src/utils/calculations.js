import BN from 'bn.js'
import { dayjs } from './date-utils'
import { addressesEqual } from './web3-utils'

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export const MONTHS_IN_A_YEAR = 12
export const SECONDS_IN_A_YEAR = new BN((365.25 * DAY) / 1000)

export function totalPaidThisYearByEmployee(payments, employeeAddress) {
  const filter = payment => {
    const yearDiff = dayjs(payment.date).diff(dayjs(), 'years')
    return (
      addressesEqual(payment.accountAddress, employeeAddress) && yearDiff === 0
    )
  }

  const totalPaid = summation(payments.filter(filter), 'denominationAmount')
  return totalPaid
}

export function getAverageSalary(employees) {
  if (!employees.length) {
    return new BN(0)
  }

  const sum = summation(employees, 'yearlySalary')
  return sum.div(new BN(employees.length))
}

export function getTotalPaidThisYear(employees) {
  return summation(employees, 'totalPaid')
}

export function getMonthlyLiability(total) {
  return total.div(new BN(MONTHS_IN_A_YEAR))
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
