import BN from 'bn.js'
import { dayjs } from './date-utils'
import { addressesEqual } from './web3-utils'

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export const MONTHS_IN_A_YEAR = 12
export const SECONDS_IN_A_MONTH = 2628000
export const SECONDS_IN_A_YEAR = new BN((365.25 * DAY) / 1000)

/**
 * Calculates the total amount paid in denomination token for a given employee
 * @param {Array} payments Array of total payments
 * @param {String} employeeAddress Address of the employee in question
 * @returns {BigNum} Total paid in denomination token for the current year
 */
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

/**
 * Calculates current avarage salary between all active employees
 * @param {Array} employees Array of all employees
 * @returns {BigNum} Avarage salary
 */
export function getAverageSalary(employees) {
  if (!employees.length) {
    return new BN(0)
  }

  const filter = employee => {
    return !employee.terminated
  }

  const sum = summation(employees.filter(filter), 'yearlySalary')
  return sum.div(new BN(employees.length))
}

/**
 * Calculates total amount paid in denomination token between all employees for the current year
 * @param {Array} employees Array of all employees
 * @returns {BigNum} Total paid for the year
 */
export function getTotalPaidThisYear(employees) {
  return summation(employees, 'totalPaid')
}

/**
 * Calculates the total yearly issuance in equity token
 * @param {Array} payments Array of all payments
 * @returns {BigNum} Total yearly issuance
 */
export function getYearlyIssuance(payments) {
  const filter = payment => {
    const yearDiff = dayjs(payment.date).diff(dayjs(), 'years')
    return yearDiff === 0
  }
  return summation(payments.filter(filter), 'equityAmount')
}

/**
 * Calculates the payroll monthly liability
 * @param {BigNum} total Total paid in a year
 * @returns {BigNum} Monthly liability
 */
export function getMonthlyLiability(total) {
  return total.div(new BN(MONTHS_IN_A_YEAR))
}

export function summation(list, field) {
  const reducer = (acc, item) => acc.add(item[field])
  const sum = list.reduce(reducer, new BN('0'))
  return sum
}

/**
 * Splits allocation percentages in ${denominationAlllcation / equityAllocation}
 * @param {BigNum} denominationAllocation The allocation chosen in denomination token
 * @param {BigNum} pctBase The base percentage
 * @returns {Array} Array with the allocation percentages
 */
export function splitAllocation(denominationAllocation, pctBase) {
  const PCT = new BN(100)

  const convertedDenominationAllocation = denominationAllocation.div(
    pctBase.div(PCT)
  )

  const convertedEquityAllocation = PCT.sub(convertedDenominationAllocation)

  return [convertedDenominationAllocation, convertedEquityAllocation]
}

/**
 * Converts the equity multiplier from pctBase
 * @param {BigNum} multiplier The equity multiplier
 * @param {BigNum} pctBase The base percentage
 * @returns {Number} The multiplier converted from pct base
 */
export function multiplierFromBase(multiplier, pctBase) {
  return parseInt(multiplier.div(pctBase.div(new BN(100)))) / 100
}

/**
 * Converts the equity multiplier to `pctBase`
 * @param {Number} multiplier The equity multiplier
 * @param {BigNum} pctBase The base percentage
 * @returns {BigNum} The multiplier converted to pct base
 */
export function multiplierToBase(multiplier, pctBase) {
  return new BN(multiplier * 100).mul(pctBase.div(new BN(100)))
}

export function secondsToMonths(seconds) {
  return Math.round(seconds / SECONDS_IN_A_MONTH)
}

export function monthsToSeconds(months) {
  return Math.round(months * SECONDS_IN_A_MONTH)
}
