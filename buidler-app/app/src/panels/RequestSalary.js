import React, { useCallback } from 'react'
import { Button, SidePanel } from '@aragon/ui'

const RequestSalary = React.memo(function RequestSalary({
  panelState,
  onRequestSalary,
}) {
  const handleClose = useCallback(() => {
    panelState.requestClose()
  }, [panelState])

  return (
    <SidePanel
      title="Request salary"
      opened={panelState && panelState.visible}
      onClose={handleClose}
    >
      <RequestSalaryContent onRequestSalary={onRequestSalary} />
    </SidePanel>
  )
})

function RequestSalaryContent({ onRequestSalary }) {
  const handleSubmit = useCallback(() => {
    event.preventDefault()

    onRequestSalary('1000000000000000000', '1000000000000000000', 'Payday')
  }, [])

  return (
    <form onSubmit={handleSubmit}>
      <Button label="Request salary" mode="strong" wide type="submit" />
    </form>
  )
}

export default RequestSalary
