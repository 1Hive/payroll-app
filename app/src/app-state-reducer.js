import BN from 'bn.js'

function appStateReducer(state) {
  if (state === null) {
    return { isSyncing: true }
  }

  const { equityMultiplier, employees, payments, pctBase } = state

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
      terminated: Boolean(employee.endDate),
    })),

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
