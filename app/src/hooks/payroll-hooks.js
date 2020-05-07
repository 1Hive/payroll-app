import { useAragonApi } from '@aragon/api-react'
import {
  totalPaidThisYear,
  summation,
  MONTHS_IN_A_YEAR,
} from '../utils/calculations'

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