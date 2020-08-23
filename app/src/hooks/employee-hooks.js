import { useMemo } from 'react'
import BN from 'bn.js'
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import { dayjs } from '../utils/date-utils'
import { addressesEqual } from '../utils/web3-utils'
import { useNow, useExternalContract, usePromise } from '../hooks/general-hooks'
import vestingsLengthAbi from '../abi/token_manager_vestings_lengths.json'

export function useEmployeeCurrentOwedSalary(employee) {
  const now = useNow()

  if (!employee) {
    return new BN(0)
  }
  const { accruedSalary, endDate, lastPayroll, salary } = employee

  const terminated = endDate && dayjs(endDate).isBefore(now)

  const accruedTime = dayjs(terminated ? endDate : now).diff(
    lastPayroll,
    'seconds'
  )

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

export function useEmployeeTotalVestings(employeeAddress) {
  const { equityTokenManager } = useAppState()

  const tokenManagerContract = useExternalContract(
    equityTokenManager.address,
    vestingsLengthAbi
  )

  const promise = useMemo(
    () => tokenManagerContract.vestingsLengths(employeeAddress).toPromise(),
    [employeeAddress, tokenManagerContract]
  )

  const totalVestings = usePromise(promise, [employeeAddress], 0)

  return totalVestings
}
