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
  } = data

  const terminationDate = date(endDate)

  const result = {
    id: id || employeeId,
    accountAddress,
    salary: denominationSalary,
    accruedSalary,
    lastPayroll: date(lastPayroll),
    startDate: date(startDate),
    endDate: terminationDate,
    terminated: Boolean(terminationDate),
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
