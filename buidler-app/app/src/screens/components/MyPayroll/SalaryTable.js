import React, { useMemo } from 'react'
import styled from 'styled-components'
import {
  DataView,
  TransactionBadge,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui'
import PaymentFilters from './PaymentFilters'
import { dateFormat } from '../../../utils/date-utils'
import { formatTokenAmount } from '../../../utils/formatting'

const columns = [
  'Date',
  'Transaction Address',
  'Base asset',
  'Split percentage (Base/Equity)',
]

function SalaryTable({
  emptyResultsViaFilters,
  filteredPayments,
  onClearFilters,
  onSelectDateRange,
  payments,
  selectedDateRange,
}) {
  const theme = useTheme()
  const { layoutName } = useLayout()
  const compactMode = layoutName === 'small'

  const dataViewStatus = useMemo(() => {
    if (emptyResultsViaFilters && payments.length > 0) {
      return 'empty-filters'
    }

    return 'default'
  }, [emptyResultsViaFilters, payments])

  return (
    <DataView
      heading={
        <>
          <div
            css={`
              color: ${theme.content};
              ${textStyle('body1')};
            `}
          >
            Previous salary
          </div>
          {!compactMode && (
            <PaymentFilters
              dateRangeFilter={selectedDateRange}
              onDateRangeChange={onSelectDateRange}
            />
          )}
        </>
      }
      status={dataViewStatus}
      statusEmpty={
        <p
          css={`
            ${textStyle('title2')};
          `}
        >
          No payments yet.
        </p>
      }
      fields={columns}
      entries={filteredPayments}
      renderEntry={({ date, token, transactionHash, amount, split }) => {
        const formattedAmount = formatTokenAmount(
          amount,
          true,
          token.decimals,
          true
        )
        return [
          <span>{dateFormat(date)}</span>,
          <TransactionBadge tx={transactionHash} networkType={network.type}>
            {rawValue}
          </TransactionBadge>,
          <Amount
            css={`
              color: ${theme.positive};
            `}
          >
            {formattedAmount}
          </Amount>,
          <span>{split}</span>,
        ]
      }}
      onStatusEmptyClear={onClearFilters}
    />
  )
}

const Amount = styled.span`
  font-weight: 600;
`

export default SalaryTable
