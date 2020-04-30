import React, { useState, useEffect } from 'react'
import TotalPayrollTable from './TotalPayrollTable'

import { useAragonApi } from '@aragon/api-react'
import { Box } from '@aragon/ui'
import {
  totalPaidThisYear,
  summation,
  MONTHS_IN_A_YEAR,
} from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatting'
import { SECONDS_IN_A_YEAR } from '../../utils/date-utils'

function TotalPayroll() {
  const {
    employeesQty = 0,
    averageSalary = 0,
    monthlyBurnRate = 0,
    totalPaidThisYear = 0,
    denominationToken = {},
    connectedAccount,
  } = useTotalPayrollData()
  const [data, setData] = useState([])

  useEffect(() => {
    setData([
      { employeesQty, averageSalary, monthlyBurnRate, totalPaidThisYear },
    ])
  }, [connectedAccount, employeesQty])

  const formatSalary = amount =>
    formatCurrency(
      amount,
      denominationToken.symbol,
      10,
      denominationToken.decimals,
      SECONDS_IN_A_YEAR
    )
  const customFormatCurrency = amount =>
    formatCurrency(amount, denominationToken.symbol, 10, 0)
  return (
    <Box heading="Total Payroll">
      <TotalPayrollTable
        data={data}
        formatSalary={formatSalary}
        formatCurrency={customFormatCurrency}
      />
    </Box>
  )
}
function parseEmployees(payments, employees) {
  return employees.map(e => {
    const totalPaid = totalPaidThisYear(payments, e.accountAddress)
    return { ...e, totalPaid }
  })
}

function getAverageSalary(employees) {
  const field = 'salary'
  const sum = summation(employees, field)
  return sum / employees.length
}

function getTotalPaidThisYear(employees) {
  const field = 'totalPaid'
  return summation(employees, field)
}

function getMonthlyBurnRate(total) {
  return total / MONTHS_IN_A_YEAR
}

export function useTotalPayrollData() {
  const { appState, connectedAccount } = useAragonApi()
  const { employees = [], denominationToken = {}, payments = [] } = appState

  const parsedEmployees = parseEmployees(payments, employees)
  const totalPaidThisYear = getTotalPaidThisYear(parsedEmployees)

  return {
    parsedEmployees,
    employeesQty: parsedEmployees.length,
    averageSalary: getAverageSalary(parsedEmployees),
    monthlyBurnRate: getMonthlyBurnRate(totalPaidThisYear),
    totalPaidThisYear,
    denominationToken,
    connectedAccount,
  }
}

export default TotalPayroll
