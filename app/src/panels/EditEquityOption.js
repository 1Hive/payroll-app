import React, { useCallback } from 'react'
import { SidePanel } from '@aragon/ui'

function EditEquityOption({ panelState }) {
  const handleClose = useCallback(() => {
    panelState.requestClose()
  }, [panelState])

  return (
    <SidePanel title="Edit equity option" onClose={handleClose}>
      <div />
    </SidePanel>
  )
}

export default EditEquityOption
