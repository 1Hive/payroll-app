import React, { useCallback, useState } from 'react'
import { useAppState } from '@aragon/api-react'
import PropTypes from 'prop-types'
import {
  Button,
  Field,
  GU,
  Info,
  SidePanel,
  TextInput,
  useSidePanelFocusOnReady,
} from '@aragon/ui'

import {
  monthsToSeconds,
  multiplierToBase,
  secondsToMonths,
  multiplierFromBase,
} from '../utils/calculations-utils'

const EditEquityPanel = React.memo(function EditEquity({
  panelState,
  onEditEquityOption,
}) {
  const {
    equityMultiplier,
    pctBase,
    vestingLength,
    vestingCliffLength,
  } = useAppState()

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
        pctBase={pctBase}
        vestingLength={vestingLength}
        vestingCliffLength={vestingCliffLength}
        onEditEquityOption={onEditEquityOption}
      />
    </SidePanel>
  )
})

function EditEquityContent({
  equityMultiplier: equityMultiplierProp,
  pctBase,
  vestingLength: vestingLengthProp,
  vestingCliffLength: vestingCliffLengthProp,
  onEditEquityOption,
}) {
  const inputRef = useSidePanelFocusOnReady()

  const [equityMultiplier, setEquityMultiplier] = useState(
    multiplierFromBase(equityMultiplierProp, pctBase)
  )
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

      const convertedMultiplier = multiplierToBase(equityMultiplier, pctBase)

      onEditEquityOption(
        convertedMultiplier.toString(),
        monthsToSeconds(vestingLength),
        monthsToSeconds(vestingCliffLength)
      )
    },
    [
      equityMultiplier,
      onEditEquityOption,
      pctBase,
      vestingCliffLength,
      vestingLength,
    ]
  )

  return (
    <form onSubmit={handleSubmit}>
      <Info
        title="Action"
        css={`
          margin: ${3 * GU}px 0;
        `}
      >
        Update the equity options which are applied for each equity request.
        Including the multiplier which is against the base asset.
      </Info>
      <Field label="Multiplier">
        <TextInput
          value={equityMultiplier}
          onChange={handleEquityMultiplierChange}
          ref={inputRef}
          required
          wide
          type="number"
          min={0}
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
          min={0}
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
          min={0}
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
  equityMultiplier: PropTypes.object,
  pctBase: PropTypes.object,
  vestingLength: PropTypes.number,
  vestingCliffLength: PropTypes.number,
}

EditEquityContent.defaultProps = {
  onEditEquityOption: () => {},
}

export default EditEquityPanel
