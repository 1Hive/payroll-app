import BN from 'bn.js'
import { SECONDS_IN_A_YEAR, dayjs } from './date-utils'
import {
  totalPaidThisYearByEmployee,
  summation,
  MONTHS_IN_A_YEAR,
} from './calculations'

export function getAverageSalary(employees) {
  const field = 'salary'
  const sum = summation(employees, field)
  return sum / employees.length
}

export function getTotalPaidThisYear(employees) {
  const field = 'totalPaid'
  return summation(employees, field)
}

export function getMonthlyBurnRate(total) {
  return total / MONTHS_IN_A_YEAR
}

export function getYearlySalary(salary) {
  return salary.mul(SECONDS_IN_A_YEAR)
}

export function getAvailableBalance(employee) {
  const accruedTime = dayjs().diff(dayjs(employee.lastPayroll), 'seconds')

  return employee.salary.mul(new BN(accruedTime)).add(employee.accruedSalary)
}

export function parseEmployees(payments, employees) {
  return employees.map(employee => {
    const totalPaid = totalPaidThisYearByEmployee(
      payments,
      employee.accountAddress
    )
    return { ...employee, totalPaid }
  })
}
