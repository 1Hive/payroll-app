import React, { useCallback, useMemo } from 'react'
import { SidePanel } from '@aragon/ui'
import { MODE } from '../types'
import AddEmployee from './AddEmployee'
import EditEquity from './EditEquity'
import RequestSalary from './RequestSalary/RequestSalary'
import TerminateEmployee from './TerminateEmployee'

const Panel = React.memo(function Panel({ actions, mode, panelState }) {
  const handleClose = useCallback(() => {
    panelState.requestClose()
  }, [panelState])

  const { action, title, PanelContent } = useMemo(() => {
    if (mode === MODE.ADD_EMPLOYEE) {
      return {
        action: actions.addEmployee,
        title: 'Add new employee',
        PanelContent: AddEmployee,
      }
    }

    if (mode === MODE.EDIT_EQUITY) {
      return {
        action: actions.editEquityOption,
        title: 'Edit Equity Option',
        PanelContent: EditEquity,
      }
    }

    if (mode === MODE.PAYDAY) {
      return {
        action: actions.payday,
        title: 'Request salary',
        PanelContent: RequestSalary,
      }
    }

    return {
      action: actions.terminateEmployee,
      title: 'Terminate employee',
      PanelContent: TerminateEmployee,
    }
  }, [actions, mode])

  return (
    <SidePanel title={title} opened={panelState?.visible} onClose={handleClose}>
      <PanelContent onAction={action} />
    </SidePanel>
  )
})

export default Panel
