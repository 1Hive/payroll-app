export function currency(value) {
  return parseInt(value || 0)
}

export function date(epoch) {
  const epochInt = parseInt(epoch)
  if (!epoch || !Number.isSafeInteger(epochInt)) {
    return null
  }

  return epochInt * 1000
}

export function employee(data) {
  const {
    id,
    accruedSalary,
    accountAddress,
    denominationSalary,
    employeeId,
    endDate,
    lastPayroll,
    role,
    startDate,
    terminated,
  } = data
  const result = {
    id: id || employeeId,
    accountAddress,
    salary: denominationSalary,
    accruedSalary,
    lastPayroll: date(lastPayroll),
    startDate: date(startDate),
    endDate: date(endDate),
    terminated: Boolean(terminated),
    role,
  }

  return result
}

// TODO: Add equity amount and denomination allocation
export function payment({
  accountAddress,
  denominationAllocation,
  denominationAmount,
  metaData,
  paymentDate,
  token,
  transactionHash,
}) {
  return {
    accountAddress,
    date: date(paymentDate),
    denominationAllocation,
    denominationAmount,
    metaData,
    token,
    transactionHash,
  }
}
