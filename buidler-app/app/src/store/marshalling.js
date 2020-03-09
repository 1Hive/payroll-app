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
    employeeId,
    accountAddress,
    name,
    denominationSalary,
    accruedValue,
    lastPayroll,
    startDate,
    endDate,
    terminated,
    role,
  } = data
  const result = {
    id: id || employeeId,
    accountAddress: accountAddress,
    name: name,
    salary: currency(denominationSalary),
    accruedValue: currency(accruedValue),
    lastPayroll: date(lastPayroll),
    startDate: date(startDate),
    endDate: date(endDate),
    terminated: !!terminated,
    role: role,
  }

  return result
}

export function tokenAllocation(data) {
  const { address, symbol, allocation } = data
  return {
    address: address,
    symbol: symbol,
    allocation: parseInt(allocation) || 0,
  }
}

export function payment(data) {
  const {
    returnValues: { amount, exchangeRate, paymentDate },
    token,
    transactionHash,
    employee,
  } = data
  const exchanged = amount / exchangeRate
  return {
    accountAddress: employee,
    amount: {
      amount: amount,
      isIncoming: true, // FIXME: Assumption: all salaries are incoming - sgobotta
      displaySign: true, // FIXME: The send payroll event should provide the displaysign option
      token: {
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
      },
    },
    transactionAddress: transactionHash,
    date: date(paymentDate),
    status: 'Complete', // FIXME: Find out how the status is calculated - - sgobotta
    exchangeRate: {
      amount: exchangeRate,
    },
    exchanged,
  }
}
