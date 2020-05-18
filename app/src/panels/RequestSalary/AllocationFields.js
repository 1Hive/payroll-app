import React, { useCallback } from 'react'
import styled from 'styled-components'
import BN from 'bn.js'
import {
  GU,
  Slider,
  TextInput,
  textStyle,
  tokenIconUrl,
  useTheme,
} from '@aragon/ui'

import { toDecimals } from '../../utils/math-utils'
import { formatTokenAmount } from '../../utils/formatting'
import { splitAllocation } from '../../utils/calculations'

const ONE_PCT = new BN(toDecimals('1', 16))

function AllocationFields({
  amount,
  baseAsset,
  baseAssetAllocation,
  equityAsset,
  equityMultiplier,
  onAllocationChange,
  pctBase,
}) {
  const theme = useTheme()

  // Allocation changed from base asset input
  const handleBaseAllocationChange = useCallback(
    event => {
      const baseAllocation = Math.min(Math.max(0, event.target.value), 100)
      const baseAllocationBN = ONE_PCT.mul(new BN(baseAllocation))

      onAllocationChange(baseAllocationBN)
    },
    [onAllocationChange]
  )

  // Allocation changed from equity asset input
  const handleEquityAllocationChange = useCallback(
    event => {
      const equityAllocation = Math.min(Math.max(0, event.target.value), 100)
      const baseAllocation = 100 - equityAllocation
      const baseAllocationBN = ONE_PCT.mul(new BN(baseAllocation))

      onAllocationChange(baseAllocationBN)
    },
    [onAllocationChange]
  )

  // Allocation changed from slider
  const handleSliderChange = useCallback(
    value => {
      const baseAllocation = (value * 100).toFixed()
      const baseAllocationBN = ONE_PCT.mul(new BN(baseAllocation))

      onAllocationChange(baseAllocationBN)
    },
    [onAllocationChange]
  )

  const BASE_ASSET_COLOR = theme.blue
  const EQUITY_ASSET_COLOR = theme.red

  // Convert allocation to %
  const [convertedBaseAllocation, convertedEquityAllocation] = splitAllocation(
    baseAssetAllocation,
    pctBase
  )

  // Calculate base asset and equity asset total amounts given the allocation used
  // Note that the equity total amount is represented in base asset decimals
  const baseAssetTotalAmount = amount.mul(baseAssetAllocation).div(pctBase)
  const equityAssetTotalAmount = amount
    .sub(baseAssetTotalAmount)
    .mul(equityMultiplier.div(pctBase))

  return (
    <div>
      <div
        css={`
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: ${1 * GU}px;
        `}
      >
        <AllocationInput
          text="Base asset percentage"
          value={convertedBaseAllocation}
          onChange={handleBaseAllocationChange}
        />
        <AllocationInput
          text="Equity asset percentage"
          value={convertedEquityAllocation}
          onChange={handleEquityAllocationChange}
          css="text-align:right"
        />
      </div>
      <CostumSlider
        value={convertedBaseAllocation / 100}
        onUpdate={handleSliderChange}
        colors={{
          baseAsset: BASE_ASSET_COLOR,
          equityAsset: EQUITY_ASSET_COLOR,
        }}
      />
      <div
        css={`
          margin-top: ${2 * GU}px;
          display: flex;
          justify-content: space-between;
        `}
      >
        <div>
          <AssetLabel color={BASE_ASSET_COLOR} label={baseAsset.symbol} />
          <span>
            {formatTokenAmount(baseAssetTotalAmount, false, baseAsset.decimals)}{' '}
            {baseAsset.symbol}
          </span>
        </div>
        <div
          css={`
            text-align: right;
          `}
        >
          <AssetLabel color={EQUITY_ASSET_COLOR} label="EQUITY" />
          <span>
            {formatTokenAmount(
              equityAssetTotalAmount,
              false,
              baseAsset.decimals
            )}{' '}
            {equityAsset.symbol}
          </span>
        </div>
      </div>
    </div>
  )
}

const AllocationInput = ({ text, value, onChange, ...props }) => {
  const theme = useTheme()
  return (
    <div {...props}>
      <span
        css={`
          ${textStyle('label2')};
          color: ${theme.contentSecondary};
          display: block;
        `}
      >
        {text}
      </span>
      <TextInput
        name="Equity allocation"
        value={value}
        onChange={onChange}
        type="number"
        css={`
          width: ${9 * GU}px;
          margin-right: ${0.5 * GU}px;
          margin-top: ${1 * GU}px;
        `}
      />
      %
    </div>
  )
}

const AssetLabel = ({ color, label }) => {
  const theme = useTheme()

  return (
    <div
      css={`
        display: flex;
        align-items: center;
        margin-bottom: ${1 * GU}px;
      `}
    >
      <div
        css={`
          background: ${color};
          width: ${1 * GU}px;
          height: ${1 * GU}px;
          border-radius: 50%;
          margin-right: ${0.5 * GU}px;
        `}
      />
      <div
        css={`
          background: ${theme.surfaceUnder};
          padding: 0px ${1 * GU}px;
          border-radius: 4px;
        `}
      >
        <img src={tokenIconUrl(label)} alt="" height={16} width={16} />
        {label}
      </div>
    </div>
  )
}

// Little hack to override default slider colors
const CostumSlider = styled(Slider)`
  padding: 0;

  & > div > div:first-child {
    & > div:first-child {
      background: ${({ colors }) => colors.equityAsset};
    }

    & > div:last-child {
      background: ${({ colors }) => colors.baseAsset};
    }
  }
`

export default AllocationFields
