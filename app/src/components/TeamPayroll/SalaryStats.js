import React from 'react'
import EquityOption from '../EquityOption'
import PaidSalariesChart from './PaidSalariesChart'
import SalaryBurnRate from './SalaryBurnRate'
import Split from '../Split'
import EditEquity from '../../panels/EditEquity'

function SalaryStats({ editEquityOptionPanel, onEditEquityOption }) {
  return (
    <Split>
      <SalaryBurnRate />
      <EquityOption
        readOnly={false}
        onRequestEquityOptionPanel={editEquityOptionPanel.requestOpen}
      />
      <EditEquity
        panelState={editEquityOptionPanel}
        onEditEquityOption={onEditEquityOption}
      />
      <PaidSalariesChart />
    </Split>
  )
}

export default SalaryStats
