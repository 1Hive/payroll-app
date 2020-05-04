import React from 'react'
import { GU, useLayout } from '@aragon/ui'
import EquityOption from '../EquityOption'
import PaidSalariesChart from './PaidSalariesChart'
import SalaryBurnRate from './SalaryBurnRate'

function SalaryStats() {
  const { layoutName } = useLayout()
  const compactMode = layoutName === 'small'

  return (
    <div
      css={`
        display: grid;
        grid-template-columns: ${compactMode ? '1fr' : '1fr 1fr 2fr'};
        grid-gap: ${2 * GU}px;
        margin-bottom: ${2 * GU}px;
      `}
    >
      <SalaryBurnRate />
      <EquityOption readOnly={false} />
      <PaidSalariesChart />
    </div>
  )
}

export default SalaryStats
