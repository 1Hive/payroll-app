import { useAppState } from '@aragon/api-react'
import { parseEmployees } from '../utils/employee'
import {
  getAverageSalary,
  getMonthlyLiability,
  getTotalPaidThisYear,
} from '../utils/calculations'

export function useParsedEmployees() {
  const { employees = [], payments = [] } = useAppState()
  const parsedEmployees = parseEmployees(payments, employees)

  return parsedEmployees
}

export function usePayrollStats() {
  const { denominationToken, equityTokenManager } = useAppState()
  const parsedEmployees = useParsedEmployees()
  const totalPaidThisYear = getTotalPaidThisYear(parsedEmployees)

  return {
    employeesQty: { value: parsedEmployees.length },
    averageSalary: {
      value: getAverageSalary(parsedEmployees),
      token: denominationToken,
    },
    monthlyLiability: {
      value: getMonthlyLiability(totalPaidThisYear),
      token: denominationToken,
      negative: true,
    },
    totalPaidThisYear: { value: totalPaidThisYear, token: denominationToken },
    issuance: { value: 0, token: equityTokenManager?.token }, // TODO: Calculate yearly issuance
  }
}
