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
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import AllocationFields from './AllocationFields'

import { toDecimals } from '../../utils/math-utils'
import { durationTime } from '../../utils/date-utils'
import { formatTokenAmount } from '../../utils/formatting'
import { convertMultiplier } from '../../utils/calculations'
import { useEmployeeTotalVestings } from '../../hooks/employee-hooks'

const RequestSalary = React.memo(function RequestSalary({
  employeeOwedSalary,
  panelState,
  onRequestSalary,
}) {
  const {
    denominationToken,
    equityMultiplier,
    equityTokenManager,
    pctBase,
    vestingLength,
    vestingCliffLength,
  } = useAppState()

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
        baseAsset={denominationToken}
        equityMultiplier={equityMultiplier}
        equityTokenManager={equityTokenManager}
        onRequestSalary={onRequestSalary}
        pctBase={pctBase}
        totalAccruedBalance={employeeOwedSalary}
        vestingLength={vestingLength}
        vestingCliffLength={vestingCliffLength}
      />
    </SidePanel>
  )
})

function RequestSalaryContent({
  baseAsset,
  equityMultiplier,
  equityTokenManager,
  onRequestSalary,
  pctBase,
  totalAccruedBalance,
  vestingLength,
  vestingCliffLength,
}) {
  const theme = useTheme()
  const connectedAccount = useConnectedAccount()

  const [allocation, setAllocation] = useState(pctBase)
  const [amount, setAmount] = useState({
    value: '0',
    valueBN: new BN(0),
    error: null,
  })

  const maxEmployeeVestings = equityTokenManager.maxVestings
  const totalVestings = useEmployeeTotalVestings(connectedAccount)

  const inputRef = useSidePanelFocusOnReady()

  const handleEditMode = useCallback(
    editMode => {
      setAmount(amount => ({
        ...amount,
        value: formatTokenAmount(
          amount.valueBN,
          false,
          baseAsset.decimals,
          false,
          {
            commas: !editMode,
            replaceZeroBy: editMode ? '' : '0',
            rounding: baseAsset.decimals,
          }
        ),
      }))
    },
    [baseAsset.decimals]
  )

  // Change amount handler
  const handleAmountChange = useCallback(
    event => {
      const newAmount = event.target.value
      let newAmountBN

      try {
        newAmountBN = new BN(toDecimals(newAmount, baseAsset.decimals))
      } catch (err) {
        newAmountBN = new BN(-1)
      }

      setAmount(amount => ({
        ...amount,
        value: newAmount,
        valueBN: newAmountBN,
      }))
    },
    [baseAsset.decimals]
  )

  const handleOnSelectMaxValue = useCallback(() => {
    setAmount(amount => ({
      ...amount,
      value: formatTokenAmount(
        totalAccruedBalance,
        false,
        baseAsset.decimals,
        false,
        {
          commas: false,
          rounding: baseAsset.decimals,
        }
      ),
      valueBN: totalAccruedBalance,
    }))
  }, [baseAsset.decimals, totalAccruedBalance])

  const handleAllocationChange = useCallback(newAllocation => {
    setAllocation(newAllocation)
  }, [])

  const handleSubmit = useCallback(() => {
    event.preventDefault()

    onRequestSalary(allocation.toString(), amount.valueBN.toString(), 'Payday')
  }, [allocation, amount, onRequestSalary])

  // Employees will be able to choose allocation of salary if:
  //   - Payroll is configured with no vesting
  //   - Payroll is configured with vesting and employee didn't reach the maximum allowed vestings
  const canChooseAllocation =
    vestingLength === 0 || totalVestings < maxEmployeeVestings

  return (
    <form onSubmit={handleSubmit}>
      <AllocationInfo
        equityMultiplier={equityMultiplier}
        pctBase={pctBase}
        vestingCliffLength={vestingCliffLength}
        vestingLength={vestingLength}
      />
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
          {formatTokenAmount(totalAccruedBalance, false, baseAsset.decimals)}{' '}
          {baseAsset.symbol}
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

      {canChooseAllocation && (
        <AllocationFields
          amount={amount.valueBN}
          baseAsset={baseAsset}
          baseAssetAllocation={allocation}
          equityAsset={equityTokenManager.token}
          equityMultiplier={equityMultiplier}
          onAllocationChange={handleAllocationChange}
          pctBase={pctBase}
        />
      )}
      {vestingLength > 0 && (
        <Info
          css={`
            margin-top: ${6 * GU}px;
          `}
          mode="warning"
        >
          {totalVestings === maxEmployeeVestings
            ? `You don’t have available vestings to do with this
          address, if you want to get paid with Equity again, you need to change
          your adress.`
            : `You have ${maxEmployeeVestings -
                totalVestings} remaining vestings available to do with
          this address.`}
        </Info>
      )}
      <Button
        css={`
          margin-top: ${2 * GU}px;
        `}
        label="Request salary"
        mode="strong"
        wide
        type="submit"
        disabled={totalAccruedBalance.isZero()}
      />
    </form>
  )
}

const AllocationInfo = ({
  equityMultiplier,
  pctBase,
  vestingCliffLength,
  vestingLength,
}) => {
  const formattedMultiplier = convertMultiplier(equityMultiplier, pctBase)

  return (
    <Info
      css={`
        margin-top: ${3 * GU}px;
      `}
    >
      <span
        css={`
          ${textStyle('label2')};
          margin-bottom: ${2 * GU}px;
          display: block;
        `}
      >
        Sallary allocation
      </span>
      You have the option to receive your salary in a combination of Base Asset
      and/or Equity asset. The Equity asset allocation is subject to a{' '}
      <span
        css={`
          ${textStyle('body2')}
        `}
      >
        {formattedMultiplier}
      </span>
      X multiplier{' '}
      {vestingCliffLength > 0 ? (
        <span>
          and {durationTime(vestingLength)} vesting period with{' '}
          {durationTime(vestingCliffLength)} cliff
        </span>
      ) : (
        `with no vesting`
      )}
      .
    </Info>
  )
}

export default RequestSalary
