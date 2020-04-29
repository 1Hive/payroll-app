import React, { useCallback, useMemo } from 'react'
import {
  AragonApi,
  useApi,
  useAppState,
  useConnectedAccount,
} from '@aragon/api-react'
import BN from 'bn.js'
import { getAllocationUpdateKey } from './utils/employee'
import { usePanelState, usePromise } from './utils/hooks'
import { addressesEqual } from './utils/web3-utils'
import appStateReducer from './app-state-reducer'

// App actions
export function useAddEmployeeAction(onDone) {
  const api = useApi()
  return useCallback(
    (accountAddress, initialSalaryPerSecond, startDateInSeconds, role) => {
      if (api) {
        api
          .addEmployee(
            accountAddress,
            initialSalaryPerSecond,
            startDateInSeconds,
            role
          )
          .toPromise()
        onDone()
      }
    },
    [api, onDone]
  )
}

export function useDetermineAllocationAction(onDone) {
  const api = useApi()
  return useCallback(
    (tokenAddresses, allocations) => {
      if (api) {
        api.determineAllocation(tokenAddresses, allocations)
        onDone()
      }
    },
    [api, onDone]
  )
}

export function usePaydayAction(onDone) {
  const api = useApi()
  return useCallback(
    (denominationTokenAllocation, reuqestedAmount, metadata) => {
      if (api) {
        api.payday(denominationTokenAllocation, reuqestedAmount, metadata)
        onDone()
      }
    },
    [api, onDone]
  )
}

// App panels
export function useAppPanels() {
  const addEmployeePanel = usePanelState()
  const editSalaryAllocationPanel = usePanelState()
  const requestSalaryPanel = usePanelState()

  return {
    // Give the edit allocation priority over the other panels
    editSalaryAllocationPanel,
    addEmployeePanel: useMemo(
      () => ({
        ...addEmployeePanel,
        // ensure there is only one panel opened at a time
        visible:
          addEmployeePanel.visible &&
          !editSalaryAllocationPanel.visible &&
          !requestSalaryPanel.visible,
      }),
      [
        addEmployeePanel,
        editSalaryAllocationPanel.visible,
        requestSalaryPanel.visible,
      ]
    ),
    requestSalaryPanel: useMemo(
      () => ({
        ...requestSalaryPanel,
        // ensure there is only one panel opened at a time
        visible:
          requestSalaryPanel.visible &&
          !editSalaryAllocationPanel.visible &&
          !addEmployeePanel.visible,
      }),
      [
        requestSalaryPanel,
        editSalaryAllocationPanel.visible,
        addEmployeePanel.visible,
      ]
    ),
  }
}

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

export function useAppLogic() {
  const { isSyncing } = useAppState()
  const {
    addEmployeePanel,
    editSalaryAllocationPanel,
    requestSalaryPanel,
  } = useAppPanels()

  const actions = {
    addEmployee: useAddEmployeeAction(addEmployeePanel.requestClose),
    payday: usePaydayAction(),
  }

  return {
    actions,
    panels: { addEmployeePanel, editSalaryAllocationPanel, requestSalaryPanel },
    isSyncing: isSyncing,
  }
}

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}
