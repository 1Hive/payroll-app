import React, { useState } from 'react'
import { DropDown, GU, LineChart, textStyle, useTheme } from '@aragon/ui'
import { chartSettings, CHART_TYPES } from '../utils/chart-utils'

function SalaryChart({ payments }) {
  const theme = useTheme()
  const [typeIndex, setTypeIndex] = useState(0)

  const { settings, labels } = chartSettings(CHART_TYPES[typeIndex], payments)
  const { denominationAmountValues, equityAmountValues } = settings

  const BASE_ASSET_COLOR = theme.blue
  const EQUITY_ASSET_COLOR = theme.red
  const colors = [BASE_ASSET_COLOR, EQUITY_ASSET_COLOR]

  return (
    <div
      css={`
        display: flex;
        align-items: flex-start;
      `}
    >
      <LineChart
        color={index => colors[index]}
        label={index => labels[index]}
        lines={[denominationAmountValues, equityAmountValues]}
        height={240}
      />
      <div
        css={`
          margin-left: ${3 * GU}px;
        `}
      >
        <DropDown
          placeholder="Period"
          header="Period"
          items={CHART_TYPES}
          selected={typeIndex}
          onChange={setTypeIndex}
          width="125px"
        />
        <div
          css={`
            margin-top: ${2 * GU}px;
          `}
        >
          <LegendItem color={BASE_ASSET_COLOR} label="Base asset" />
          <LegendItem color={EQUITY_ASSET_COLOR} label="Equity asset" />
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label }) {
  const theme = useTheme()

  return (
    <div
      css={`
        display: flex;
        align-items: center;
      `}
    >
      <div
        css={`
          background: ${color};
          height: ${1 * GU}px;
          width: ${1 * GU}px;
          border-radius: 50%;
          margin-right: ${1 * GU}px;
        `}
      />
      <span
        css={`
          ${textStyle('label1')}
          color: ${theme.contentSecondary};
        `}
      >
        {label}
      </span>
    </div>
  )
}

export default SalaryChart
