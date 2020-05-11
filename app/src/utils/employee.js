import BN from 'bn.js'
import { SECONDS_IN_A_YEAR, dayjs } from './date-utils'
import { totalPaidThisYearByEmployee } from './calculations'

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
