import React from 'react'
import EquityOption from '../EquityOption'
import MySalaryChart from './MySalaryChart'
import Salary from './Salary'
import Split from '../Split'

function MySalary() {
  return (
    <Split>
      <Salary />
      <EquityOption />
      <MySalaryChart />
    </Split>
  )
}

export default React.memo(MySalary)