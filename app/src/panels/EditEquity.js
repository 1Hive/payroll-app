import React, { useCallback } from 'react'
import { SidePanel } from '@aragon/ui'

const EditEquity = React.memo(function EditEquity({ editEquityOptionPanel }) {
  const handleClose = useCallback(() => {
    editEquityOptionPanel.requestClose()
  }, [editEquityOptionPanel])
  return (
    <SidePanel
      title="Edit Equity"
      opened={editEquityOptionPanel && editEquityOptionPanel.visible}
      onClose={handleClose}
    >
      <div />
    </SidePanel>
  )
})

export default EditEquity
