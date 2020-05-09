import React from 'react'
import { DateRangePicker, DropDown, GU } from '@aragon/ui'

function PaymentFilters({
  dateFilter,
  onDateChange,
  token,
  tokenFilter,
  onTokenChange,
}) {
  return (
    <div
      css={`
        margin-top: ${3 * GU}px;
        display: inline-grid;
        grid-gap: ${1.5 * GU}px;
        grid-template-columns: auto auto auto;
      `}
    >
      <DropDown
        placeholder="Token (All)"
        header="Token"
        items={token}
        selected={tokenFilter}
        onChange={onTokenChange}
        width="140px"
      />
      <DateRangePicker startDate={dateFilter} onChange={onDateChange} />
    </div>
  )
}

export default PaymentFilters
