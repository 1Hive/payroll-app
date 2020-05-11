import BN from 'bn.js'
import { dayjs } from './date-utils'
import { addressesEqual } from './web3-utils'

export const MONTHS_IN_A_YEAR = 12

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
