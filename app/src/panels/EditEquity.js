import React, { useCallback, useState } from 'react'
import { useAppState } from '@aragon/api-react'
import PropTypes from 'prop-types'
import {
  Button,
  Field,
  TextInput,
  GU,
  SidePanel,
  useSidePanelFocusOnReady,
} from '@aragon/ui'

import { monthsToSeconds, secondsToMonths } from '../utils/calculations'

const EditEquityPanel = React.memo(function EditEquity({
  panelState,
  onEditEquityOption,
}) {
  const { equityMultiplier, vestingLength, vestingCliffLength } = useAppState()

  const handleClose = useCallback(() => {
    panelState.requestClose()
  }, [panelState])

  return (
    <SidePanel
      title="Edit Equity Option"
      opened={panelState && panelState.visible}
      onClose={handleClose}
    >
      <EditEquityContent
        equityMultiplier={equityMultiplier}
        vestingLength={vestingLength}
        vestingCliffLength={vestingCliffLength}
        onEditEquityOption={onEditEquityOption}
      />
    </SidePanel>
  )
})

function EditEquityContent({
  equityMultiplier: equityMultiplierProp,
  vestingLength: vestingLengthProp,
  vestingCliffLength: vestingCliffLengthProp,
  onEditEquityOption,
}) {
  const inputRef = useSidePanelFocusOnReady()

  const [equityMultiplier, setEquityMultiplier] = useState(equityMultiplierProp)
  const [vestingLength, setVestingLength] = useState(
    secondsToMonths(vestingLengthProp)
  )
  const [vestingCliffLength, setVestingCliffLength] = useState(
    secondsToMonths(vestingCliffLengthProp)
  )

  const handleEquityMultiplierChange = useCallback(event => {
    setEquityMultiplier(event.target.value)
  }, [])

  const handleVestingLengthChange = useCallback(event => {
    setVestingLength(event.target.value)
  }, [])

  const handleVestingCliffLengthChange = useCallback(event => {
    setVestingCliffLength(event.target.value)
  }, [])

  const handleSubmit = useCallback(
    event => {
      event.preventDefault()

      onEditEquityOption(
        equityMultiplier,
        monthsToSeconds(vestingLength),
        monthsToSeconds(vestingCliffLength)
      )
    },
    [equityMultiplier, onEditEquityOption, vestingCliffLength, vestingLength]
  )

  return (
    <form onSubmit={handleSubmit}>
      <Field
        css={`
          margin-top: ${3 * GU}px;
        `}
        label="Multiplier"
      >
        <TextInput
          value={equityMultiplier}
          onChange={handleEquityMultiplierChange}
          ref={inputRef}
          required
          wide
          type="number"
        />
      </Field>
      <Field
        css={`
          margin-top: ${3 * GU}px;
        `}
        label="Vesting period (in months)"
      >
        <TextInput
          value={vestingLength}
          onChange={handleVestingLengthChange}
          required
          wide
          type="number"
        />
      </Field>
      <Field
        css={`
          margin-top: ${3 * GU}px;
        `}
        label="Vesting cliff (in months)"
      >
        <TextInput
          value={vestingCliffLength}
          onChange={handleVestingCliffLengthChange}
          required
          wide
          type="number"
        />
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

EditEquityContent.propTypes = {
  equityMultiplier: PropTypes.number,
  vestingLength: PropTypes.number,
  vestingCliffLength: PropTypes.number,
}

EditEquityContent.defaultProps = {
  onEditEquityOption: () => {},
}

export default EditEquityPanel
