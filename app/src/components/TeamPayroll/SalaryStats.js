import React from 'react'
import { GU, useLayout } from '@aragon/ui'
import EquityOption from '../EquityOption'
import PaidSalariesChart from './PaidSalariesChart'

function SalaryStats({ editEquityOptionPanel }) {
  const { layoutName } = useLayout()
  const compactMode = layoutName === 'small' || layoutName === 'medium'
  return (
    <div
      css={`
        display: grid;
        grid-template-columns: ${compactMode ? '1fr' : '3fr 1fr'};
        grid-gap: ${2 * GU}px;
        margin-bottom: ${2 * GU}px;
      `}
    >
      <PaidSalariesChart />
      <EquityOption
        readOnly={false}
        onRequestEquityOptionPanel={editEquityOptionPanel.requestOpen}
      />
    </div>
  )
}

export default SalaryStats
