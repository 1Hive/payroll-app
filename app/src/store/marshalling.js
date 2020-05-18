export function date(epoch) {
  const epochInt = parseInt(epoch)
  if (!epoch || !Number.isSafeInteger(epochInt)) {
    return null
  }

  return epochInt * 1000
}

// TODO: Possibly move all conversions to app-state-reducer
export function payment({
  accountAddress,
  denominationAllocation,
  denominationAmount,
  equityAmount,
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
    equityAmount,
    metaData,
    token,
    transactionHash,
  }
}
