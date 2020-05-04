import React, { useCallback, useState } from 'react'
import {
  Button,
  ButtonBase,
  Field,
  GU,
  Info,
  SidePanel,
  TextInput,
  textStyle,
  useSidePanelFocusOnReady,
  useTheme,
} from '@aragon/ui'
import BN from 'bn.js'
import { useAppState } from '@aragon/api-react'
import { formatTokenAmount } from '../utils/formatting'
import { toDecimals } from '../utils/math-utils'

const RequestSalary = React.memo(function RequestSalary({
  employeeOwedSalary,
  panelState,
  onRequestSalary,
}) {
  const { denominationToken } = useAppState()

  const handleClose = useCallback(() => {
    panelState.requestClose()
  }, [panelState])

  return (
    <SidePanel
      title="Request salary"
      opened={panelState && panelState.visible}
      onClose={handleClose}
    >
      <RequestSalaryContent
        onRequestSalary={onRequestSalary}
        token={denominationToken}
        totalAccruedBalance={employeeOwedSalary}
      />
    </SidePanel>
  )
})

function RequestSalaryContent({ onRequestSalary, token, totalAccruedBalance }) {
  const theme = useTheme()
  const [amount, setAmount] = useState({
    value: '0',
    valueBN: new BN(0),
    error: null,
  })

  const inputRef = useSidePanelFocusOnReady()

  const handleEditMode = useCallback(
    editMode => {
      setAmount(amount => ({
        ...amount,
        value: formatTokenAmount(amount.valueBN, false, token.decimals, false, {
          commas: !editMode,
          replaceZeroBy: editMode ? '' : '0',
          rounding: token.decimals,
        }),
      }))
    },
    [token.decimals]
  )

  // Change amount handler
  const handleAmountChange = useCallback(
    event => {
      const newAmount = event.target.value
      let newAmountBN

      try {
        newAmountBN = new BN(toDecimals(newAmount, token.decimals))
      } catch (err) {
        newAmountBN = new BN(-1)
      }

      setAmount(amount => ({
        ...amount,
        value: newAmount,
        valueBN: newAmountBN,
      }))
    },
    [token.decimals]
  )

  const handleOnSelectMaxValue = useCallback(() => {
    setAmount(amount => ({
      ...amount,
      value: formatTokenAmount(
        totalAccruedBalance,
        false,
        token.decimals,
        false,
        {
          commas: false,
          rounding: token.decimals,
        }
      ),
      valueBN: totalAccruedBalance,
    }))
  }, [token.decimals, totalAccruedBalance])

  const handleSubmit = useCallback(() => {
    event.preventDefault()

    // TODO: UI for choosing allocation
    const denominationTokenAllocation = '1000000000000000000'

    onRequestSalary(
      denominationTokenAllocation,
      amount.valueBN.toString(),
      'Payday'
    )
  }, [amount])

  return (
    <form onSubmit={handleSubmit}>
      <Info
        css={`
          margin-top: ${3 * GU}px;
        `}
      >
        Info about allocation
      </Info>
      <div
        css={`
          margin-top: ${3 * GU}px;
        `}
      >
        <h3
          css={`
            color: ${theme.contentSecondary};
          `}
        >
          Total accrued balance
        </h3>
        <span
          css={`
            ${textStyle('title2')}
          `}
        >
          {formatTokenAmount(totalAccruedBalance, false, token.decimals)}{' '}
          {token.symbol}
        </span>
      </div>
      <Field
        css={`
          margin-top: ${3 * GU}px;
        `}
        label="Amount to request"
      >
        <TextInput
          name="amount"
          wide
          onChange={handleAmountChange}
          onFocus={() => handleEditMode(true)}
          onBlur={() => handleEditMode(false)}
          value={amount.value}
          ref={inputRef}
          required
          adornment={
            <ButtonBase
              css={`
                margin-right: ${1 * GU}px;
                color: ${theme.accent};
              `}
              onClick={handleOnSelectMaxValue}
            >
              MAX
            </ButtonBase>
          }
          adornmentPosition="end"
        />
      </Field>
      {/* TODO: Add allocation % slider and vestings warning */}
      <Button
        css={`
          margin-top: ${2 * GU}px;
        `}
        label="Request salary"
        mode="strong"
        wide
        type="submit"
      />
    </form>
  )
}

export default RequestSalary
