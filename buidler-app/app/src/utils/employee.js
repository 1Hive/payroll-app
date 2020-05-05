import { SECONDS_IN_A_YEAR, dayjs } from './date-utils'
import BN from 'bn.js'

export function getYearlySalary(employee) {
  return employee.data.denominationSalary.mul(SECONDS_IN_A_YEAR)
}

export function getAvailableBalance(employee) {
  const accruedTime = dayjs().diff(dayjs(employee.lastPayroll), 'seconds')

  return employee.salary.mul(new BN(accruedTime)).add(employee.accruedSalary)
}