import React, { useCallback } from 'react'
import { Button, Field, TextInput, GU, SidePanel } from '@aragon/ui'

const EditEquity = React.memo(function EditEquity({ editEquityOptionPanel }) {
  const handleClose = useCallback(() => {
    editEquityOptionPanel.requestClose()
  }, [editEquityOptionPanel])
  return (
    <SidePanel
      title="Edit Equity Option"
      opened={editEquityOptionPanel && editEquityOptionPanel.visible}
      onClose={handleClose}
    >
      <EditEquityContent />
    </SidePanel>
  )
})

function EditEquityContent() {
  const handleSubmit = useCallback(() => {
    // some logic goes here
  }, [])

  return (
    <form onSubmit={handleSubmit}>
      <Field
        css={`
          margin-top: ${3 * GU}px;
          max-width: 100%;
        `}
        label="Multiplier"
      >
        <TextInput wide />
      </Field>
      <Field
        css={`
          margin-top: ${3 * GU}px;
          max-width: 100%;
        `}
        label="Vesting period (in months)"
      >
        <TextInput wide />
      </Field>
      <Field
        css={`
          margin-top: ${3 * GU}px;
          max-width: 100%;
        `}
        label="Vesting cliff (in months)"
      >
        <TextInput wide />
      </Field>

      <Button
        css={`
          margin-top: ${2 * GU}px;
        `}
        label="Save changes"
        mode="strong"
        wide
        type="submit"
      />
    </form>
  )
}

export default EditEquity
