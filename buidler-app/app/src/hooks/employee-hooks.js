import BN from 'bn.js'
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import { useNow } from '../utils/hooks'
import { dayjs } from '../utils/date-utils'
import { addressesEqual } from '../utils/web3-utils'

export function useEmployeeCurrentOwedSalary(employee) {
  const now = useNow()

  if (!employee) {
    return new BN(0)
  }
  const { accruedSalary, salary, lastPayroll } = employee

  const accruedTime = dayjs(now).diff(lastPayroll, 'seconds')

  const currentOwedSalary = salary.mul(new BN(accruedTime))
  return accruedSalary.add(currentOwedSalary)
}

export function useCurrentEmployee() {
  const { employees = [] } = useAppState()
  const connectedAccount = useConnectedAccount()

  if (!connectedAccount) {
    return null
  }

  return employees.find(employee =>
    addressesEqual(employee.accountAddress, connectedAccount)
  )
}
