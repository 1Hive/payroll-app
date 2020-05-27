import BN from 'bn.js'
import { getYearlySalary } from './utils/employee-utils'

function appStateReducer(state) {
  if (state === null) {
    return { isSyncing: true }
  }

  const {
    equityMultiplier,
    employees,
    payments,
    pctBase,
    vestingLength,
    vestingCliffLength,
  } = state

  return {
    ...state,

    numData: {
      pctBase: parseInt(pctBase, 10),
      equityMultiplier: parseInt(equityMultiplier, 10),
    },

    employees: employees?.map(({ accruedSalary, salary, ...employee }) => ({
      ...employee,
      accruedSalary: new BN(accruedSalary),
      salary: new BN(salary),
      yearlySalary: getYearlySalary(new BN(salary)),
      terminated: Boolean(employee.endDate),
    })),

    vestingLength: parseInt(vestingLength, 10),
    vestingCliffLength: parseInt(vestingCliffLength, 10),

    pctBase: new BN(pctBase.toString()),
    equityMultiplier: new BN(equityMultiplier.toString()),
    payments:
      payments?.map(
        ({
          denominationAllocation,
          denominationAmount,
          equityAmount,
          ...payment
        }) => ({
          ...payment,
          denominationAllocation: new BN(denominationAllocation),
          denominationAmount: new BN(denominationAmount),
          equityAmount: new BN(equityAmount),
        })
      ) || [],
  }
}

export default appStateReducer
