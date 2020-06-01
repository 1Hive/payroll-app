import { useAppState } from '@aragon/api-react'
import { parseEmployees } from '../utils/employee-utils'
import {
  getAverageSalary,
  getMonthlyLiability,
  getTotalPaidThisYear,
  getYearlyIssuance,
} from '../utils/calculations-utils'

export function useParsedEmployees() {
  const { employees = [], payments = [] } = useAppState()
  const parsedEmployees = parseEmployees(payments, employees)

  return parsedEmployees
}

export function usePayrollStats() {
  const { denominationToken, equityTokenManager, payments = [] } = useAppState()
  const parsedEmployees = useParsedEmployees()
  const totalPaidThisYear = getTotalPaidThisYear(parsedEmployees)
  const yearlyIssuance = getYearlyIssuance(payments)

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
    issuance: { value: yearlyIssuance, token: equityTokenManager.token },
  }
}
