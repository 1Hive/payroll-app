import { useApi, useAppState, useConnectedAccount } from '@aragon/api-react'
import BN from 'bn.js'
import { getAllocationUpdateKey } from '../utils/employee'
import { usePromise } from '../utils/hooks'
import { addressesEqual } from '../utils/web3-utils'

// App state
export function useCurrentEmployee() {
  const api = useApi()
  const connectedAccount = useConnectedAccount()
  const { allowedTokens, employees } = useAppState()

  // May be undefined if current connected account is not an employee
  const currentEmployee = employees.find(employee =>
    addressesEqual(employee.accountAddress, connectedAccount)
  )

  const currentEmployeeSalaryAllocations = usePromise(
    () => async () => {
      if (!currentEmployee || currentEmployee.removed) {
        return []
      }
      const { employeeId } = currentEmployee

      const possibleAllocations = await Promise.all(
        allowedTokens.map(async token => {
          const allocation = await api
            .call('getAllocation', employeeId, token.address)
            .toPromise()
          return {
            token,
            allocation: new BN(allocation),
          }
        })
      )
      // Employee may only have some of these allowed tokens selected for their allocation
      return possibleAllocations.filter(
        ({ allocation }) => !allocation.isZero()
      )
    },
    [getAllocationUpdateKey(currentEmployee), allowedTokens]
  )

  return {
    currentEmployee,
    currentEmployeeSalaryAllocations,
  }
}
