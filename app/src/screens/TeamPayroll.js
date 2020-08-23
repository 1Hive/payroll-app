import React from 'react'
import EmployeeList from '../components/TeamPayroll/EmployeeList'
import KeyStats from '../components/TeamPayroll/KeyStats'
import SalaryStats from '../components/TeamPayroll/SalaryStats'

function TeamPayroll({
  isSyncing,
  onRequestEditEquityOption,
  onRequestTerminateEmployee,
}) {
  if (isSyncing) return null

  return (
    <div>
      <KeyStats />
      <SalaryStats onRequestEditEquityOption={onRequestEditEquityOption} />
      <EmployeeList onRequestTerminateEmployee={onRequestTerminateEmployee} />
    </div>
  )
}

export default React.memo(TeamPayroll)
