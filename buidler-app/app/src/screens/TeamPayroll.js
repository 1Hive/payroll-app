import React from 'react'
import EmployeeList from '../components/TeamPayroll/EmployeeList'
import KeyStats from '../components/TeamPayroll/KeyStats'
import { AddEmployee } from '../panels'
import SalaryStats from '../components/TeamPayroll/SalaryStats'

function TeamPayroll({ panelState, onAddEmployee }) {
  return (
    <div>
      <KeyStats />
      <SalaryStats />
      <EmployeeList />
      <AddEmployee onAddEmployee={onAddEmployee} panelState={panelState} />
    </div>
  )
}

export default React.memo(TeamPayroll)
