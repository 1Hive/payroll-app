import React from 'react'
import EquityOption from '../EquityOption'
import PaidSalariesChart from './PaidSalariesChart'
import SalaryBurnRate from './SalaryBurnRate'
import Split from '../Split'

function SalaryStats({ editEquityOptionPanel }) {
  return (
    <Split>
      <SalaryBurnRate />
      <EquityOption
        readOnly={false}
        onRequestEquityOptionPanel={editEquityOptionPanel.requestOpen}
      />
      <PaidSalariesChart />
    </Split>
  )
}

export default SalaryStats
