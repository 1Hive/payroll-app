import React from 'react'
import EquityOption from '../EquityOption'
import PaidSalariesChart from './PaidSalariesChart'
import SalaryBurnRate from './SalaryBurnRate'
import Split from '../Split'

function SalaryStats() {
  return (
    <Split>
      <SalaryBurnRate />
      <EquityOption readOnly={false} />
      <PaidSalariesChart />
    </Split>
  )
}

export default SalaryStats