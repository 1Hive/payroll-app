import React, { useState } from 'react'
import styled from 'styled-components'

import EmployeeTable from './EmployeeTable'
import RoleFilter from './RoleFilter'
import StatusFilter from './StatusFilter'
import { formatCurrency, SECONDS_IN_A_YEAR } from '../../utils/formatting'
import { useTotalPayrollData } from './TotalPayroll'
import { Box } from '@aragon/ui'

const Filters = styled.div`
  display: flex;
  justify-content: space-between;

  > * {
    margin-left: 1rem;
  }
`

function EmployeeList() {
  const {
    parsedEmployees: employees,
    denominationToken,
  } = useTotalPayrollData()

  const [roleFilter, setRoleFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)

  const handleClearFilters = () => {
    setRoleFilter(null)
    setStatusFilter(null)
  }

  const filters = [
    ...(roleFilter && roleFilter.filter ? [roleFilter.filter] : []),
    ...(statusFilter && statusFilter.filter ? [statusFilter.filter] : []),
  ]
  const customSalaryFormat = amount =>
    formatCurrency(
      amount,
      denominationToken.symbol,
      10,
      denominationToken.decimals,
      SECONDS_IN_A_YEAR
    )
  const customCurrencyFormat = amount =>
    formatCurrency(amount, denominationToken.symbol, 10, 0)
  const roles = new Set(employees.map(e => e.role))

  return (
    <Box heading="Employees">
      <Filters>
        <StatusFilter active={statusFilter} onChange={setStatusFilter} />
        <RoleFilter
          active={roleFilter}
          onChange={setRoleFilter}
          roles={roles}
        />
      </Filters>
      <EmployeeTable
        data={employees}
        formatSalary={customSalaryFormat}
        formatCurrency={customCurrencyFormat}
        filters={filters}
        onClearFilters={handleClearFilters}
      />
    </Box>
  )
}

export default EmployeeList
