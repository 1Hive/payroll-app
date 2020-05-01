import React from 'react'
import { DateRangePicker, GU } from '@aragon/ui'

function PaymentFilters({ dateRangeFilter, onDateRangeChange }) {
  return (
    <div
      css={`
        margin-top: ${3 * GU}px;
        display: inline-grid;
        grid-gap: ${1.5 * GU}px;
        grid-template-columns: auto auto auto;
      `}
    >
      <DateRangePicker
        startDate={dateRangeFilter.start}
        endDate={dateRangeFilter.end}
        onChange={onDateRangeChange}
      />
    </div>
  )
}

export default PaymentFilters
