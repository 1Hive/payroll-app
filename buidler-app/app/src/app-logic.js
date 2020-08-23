import React, { useCallback } from 'react'
import { AragonApi, useAppState, useApi, useAragonApi } from '@aragon/api-react'
import { toDecimals } from './utils/math-utils'
import { SECONDS_IN_A_YEAR } from './utils/formatting'

import usePanelState from './hooks/usePanelState'

const appStateReducer = state => {
  if (state === null) {
    return { isSyncing: true }
  }
  return state
}

export function useAddEmployeeAction(onDone = f => f) {
  const { api, appState } = useAragonApi()
  const { denominationToken } = appState
  return useCallback(
    (address, salary, name, role, startDate) => {
      const initialDenominationSalary = salary / SECONDS_IN_A_YEAR

      const adjustedAmount = toDecimals(
        initialDenominationSalary.toString(),
        denominationToken.decimals,
        {
          truncate: true,
        }
      )
      const _startDate = Math.floor(startDate.getTime() / 1000).toString()
      // Don't care about response
      console.log(address, adjustedAmount, _startDate, role)
      api.addEmployee(address, adjustedAmount, _startDate, role).toPromise()
      onDone()
    },
    [api, onDone, denominationToken]
  )
}

export function useRequestSalaryAction(onDone = f => f) {
  const api = useApi()
  return useCallback(() => {
    // Don't care about response
    api.payday(0, 0, []).toPromise()
    onDone()
  }, [api, onDone])
}

// Handles the main logic of the app.
export function useAppLogic() {
  const { isSyncing } = useAppState()

  const addEmployeePanel = usePanelState()
  // const requestSalaryPanel = usePanelState()

  const actions = {
    addEmployee: useAddEmployeeAction(addEmployeePanel.requestClose),
    requestSalary: useRequestSalaryAction(),
  }

  return {
    actions,
    isSyncing: isSyncing,
    addEmployeePanel,
    // requestSalaryPanel,
  }
}

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}
