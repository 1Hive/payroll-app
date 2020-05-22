import React from 'react'
import { AddEmployee, EditEquity } from '../panels'
import EmployeeList from '../components/TeamPayroll/EmployeeList'
import KeyStats from '../components/TeamPayroll/KeyStats'
import SalaryStats from '../components/TeamPayroll/SalaryStats'

function TeamPayroll({
  addEmployeePanel,
  editEquityOptionPanel,
  onAddEmployee,
  onEditEquityOption,
}) {
  return (
    <div>
      <KeyStats />
      <SalaryStats
        editEquityOptionPanel={editEquityOptionPanel}
        onEditEquityOption={onEditEquityOption}
      />
      <EditEquity
        panelState={editEquityOptionPanel}
        onEditEquityOption={onEditEquityOption}
      />
      <EmployeeList />
      <AddEmployee
        onAddEmployee={onAddEmployee}
        addEmployeePanel={addEmployeePanel}
      />
    </div>
  )
}

export default React.memo(TeamPayroll)
