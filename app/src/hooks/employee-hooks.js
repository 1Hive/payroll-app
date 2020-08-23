import BN from 'bn.js'
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import { dayjs } from '../utils/date-utils'
import { addressesEqual } from '../utils/web3-utils'
import { useNow, useExternalContract, usePromise } from '../utils/hooks'
import vestingsLengthAbi from '../abi/token_manager_vestings_lengths.json'

export function useEmployeeCurrentOwedSalary(employee) {
  const now = useNow()

  if (!employee) {
    return new BN(0)
  }
  const { accruedSalary, endDate, lastPayroll, salary } = employee

  const accruedTime = dayjs(endDate || now).diff(lastPayroll, 'seconds')

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

  const totalVestings = usePromise(
    tokenManagerContract.vestingsLengths(employeeAddress).toPromise(),
    [employeeAddress],
    0
  )

  return totalVestings
}
