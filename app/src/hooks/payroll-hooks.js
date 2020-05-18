import { useAragonApi } from '@aragon/api-react'
import {
  getAverageSalary,
  getMonthlyBurnRate,
  getTotalPaidThisYear,
  parseEmployees,
} from '../utils/employee'

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
