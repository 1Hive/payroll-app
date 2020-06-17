import React, { useCallback, useState } from 'react'
import { AragonApi, useApi, useAppState } from '@aragon/api-react'
import appStateReducer from './app-state-reducer'
import { usePanelState } from './hooks/general-hooks'
import { MODE } from './types'

export function useRequestMode(requestPanelOpen) {
  const [requestMode, setRequestMode] = useState(MODE.ADD_EMPLOYEE)

  const updateMode = useCallback(
    newMode => {
      setRequestMode(newMode)
      requestPanelOpen()
    },
    [requestPanelOpen]
  )

  return [requestMode, updateMode]
}

// App actions
export function useEditEquityOptionAction(onDone) {
  const api = useApi()
  return useCallback(
    (equityMultiplier, vestingLength, vestingCliffLength) => {
      if (api) {
        api
          .setEquitySettings(
            equityMultiplier,
            vestingLength,
            vestingCliffLength,
            true
          )
          .toPromise()
        onDone()
      }
    },
    [api, onDone]
  )
}

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

export function useTerminateEmployeeAction(onDone) {
  const api = useApi()

  return useCallback(
    (employeeId, endDate) => {
      if (api) {
        api.terminateEmployee(employeeId, endDate).toPromise()
        onDone()
      }
    },
    [api, onDone]
  )
}

// Requests to set new mode and open side panel
export function useRequestActions(request) {
  const addEmployee = useCallback(() => {
    request(MODE.ADD_EMPLOYEE)
  }, [request])

  const editEquityOption = useCallback(() => {
    request(MODE.EDIT_EQUITY)
  }, [request])

  const payday = useCallback(() => {
    request(MODE.PAYDAY)
  }, [request])

  const terminateEmployee = useCallback(() => {
    request(MODE.TERMINATE_EMPLOYEE)
  }, [request])

  return { addEmployee, editEquityOption, payday, terminateEmployee }
}

export function useAppLogic() {
  const { isSyncing } = useAppState()
  const panelState = usePanelState()

  const [mode, setMode] = useRequestMode(panelState.requestOpen)

  const actions = {
    addEmployee: useAddEmployeeAction(panelState.requestClose),
    editEquityOption: useEditEquityOptionAction(panelState.requestClose),
    payday: usePaydayAction(panelState.requestClose),
    terminateEmployee: useTerminateEmployeeAction(panelState.requestClose),
  }

  const requests = useRequestActions(setMode)

  return {
    actions,
    isSyncing: isSyncing,
    mode,
    panelState,
    requests,
  }
}

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}
