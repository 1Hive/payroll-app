import React from 'react'
import { RequestSalary } from '../panels'
import MySalary from '../components/MyPayroll/MySalary'
import PreviousSalary from '../components/MyPayroll/PreviousSalary'
import {
  useEmployeeCurrentOwedSalary,
  useCurrentEmployee,
} from '../hooks/employee-hooks'

function MyPayroll({ isSyncing, onRequestSalary, panelState }) {
  const employee = useCurrentEmployee()
  const employeeOwedSalary = useEmployeeCurrentOwedSalary(employee)

  return (
    <div>
      {!isSyncing && (
        <>
          <MySalary />
          <PreviousSalary />
        </>
      )}
      <RequestSalary
        onRequestSalary={onRequestSalary}
        panelState={panelState}
        employeeOwedSalary={employeeOwedSalary}
      />
    </div>
  )
}

export default React.memo(MyPayroll)