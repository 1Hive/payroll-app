import React, { useCallback, useMemo } from 'react'
import { AragonApi, useApi, useAppState } from '@aragon/api-react'
import { usePanelState } from './utils/hooks'
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

export function usePaydayAction(onDone) {
  const api = useApi()
  return useCallback(
    (denominationTokenAllocation, requestedAmount, metadata) => {
      if (api) {
        api
          .payday(denominationTokenAllocation, requestedAmount, metadata)
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

export function useAppLogic() {
  const { isSyncing } = useAppState()
  const {
    addEmployeePanel,
    editSalaryAllocationPanel,
    requestSalaryPanel,
  } = useAppPanels()

  const actions = {
    addEmployee: useAddEmployeeAction(addEmployeePanel.requestClose),
    payday: usePaydayAction(requestSalaryPanel.requestClose),
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
