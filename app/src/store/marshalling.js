export function date(epoch) {
  const epochInt = parseInt(epoch)
  if (!epoch || !Number.isSafeInteger(epochInt)) {
    return null
  }

  return epochInt * 1000
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
