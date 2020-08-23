import React, { useCallback, useState } from 'react'
import {
  Button,
  ButtonBase,
  Field,
  GU,
  Info,
  TextInput,
  textStyle,
  useSidePanelFocusOnReady,
  useTheme,
} from '@aragon/ui'
import BN from 'bn.js'
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import AllocationFields from './AllocationFields'

import {
  useCurrentEmployee,
  useEmployeeTotalVestings,
  useEmployeeCurrentOwedSalary,
} from '../../hooks/employee-hooks'
import { toDecimals } from '../../utils/math-utils'
import { durationTime } from '../../utils/date-utils'
import { formatTokenAmount } from '../../utils/formatting-utils'
import { multiplierFromBase } from '../../utils/calculations-utils'

const RequestSalary = React.memo(function RequestSalary({
  onAction: onRequestSalary,
}) {
  const {
    denominationToken,
    equityMultiplier,
    equityTokenManager,
    pctBase,
    vestingLength,
    vestingCliffLength,
  } = useAppState()

  const employee = useCurrentEmployee()
  const employeeOwedSalary = useEmployeeCurrentOwedSalary(employee)

  return (
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
          onAllocationChange={setAllocation}
          pctBase={pctBase}
        />
      )}
      {vestingLength > 0 && (
        <Info
          title="Equity Payments Limit"
          mode="warning"
          css={`
            margin-top: ${6 * GU}px;
          `}
        >
          {totalVestings === maxEmployeeVestings
            ? `You don’t have available vestings to do with this
          address, if you want to get paid with Equity again, you need to change
          your adress.`
            : `This address can request equity up to ${maxEmployeeVestings -
                totalVestings} more times while vesting is enabled for equity payments`}
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
  const formattedMultiplier = multiplierFromBase(equityMultiplier, pctBase)

  return (
    <Info
      title="Salary allocation"
      css={`
        margin-top: ${3 * GU}px;
      `}
    >
      <div
        css={`
          margin-bottom: ${1 * GU}px;
        `}
      >
        You have the option to receive your salary in a combination of Base
        Asset and/or Equity asset. The Equity asset allocation is subject to a{' '}
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
        ) : 
          'with no vesting'
        }
        .
      </div>
      <strong>
        Requesting any salary under the total available will forfeit the
        remainder.
      </strong>
    </Info>
  )
}

export default RequestSalary
