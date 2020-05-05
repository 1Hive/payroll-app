import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useNetwork, useAppState } from '@aragon/api-react'
import {
  DataView,
  TransactionBadge,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui'
import PaymentFilters from './PaymentFilters'
import { dateFormat } from '../../utils/date-utils'
import { formatTokenAmount, splitAllocation } from '../../utils/formatting'

const columns = [
  'Date',
  'Transaction Address',
  'Base asset',
  'Split percentage (Base/Equity)',
]

function PaymentsTable({
  emptyResultsViaFilters,
  filteredPayments,
  onClearFilters,
  onSelectDateRange,
  onSelectToken,
  payments,
  selectedDateRange,
  selectedToken,
  tokens,
}) {
  const theme = useTheme()
  const network = useNetwork()
  const { layoutName } = useLayout()
  const { pctBase } = useAppState()
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
              token={tokens}
              tokenFilter={selectedToken}
              onTokenChange={onSelectToken}
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
      renderEntry={({
        date,
        token,
        transactionHash,
        denominationAmount,
        denominationAllocation,
      }) => {
        const formattedAmount = formatTokenAmount(
          denominationAmount,
          true,
          token.decimals,
          true
        )
        return [
          <span>{dateFormat(date)}</span>,
          <TransactionBadge
            transaction={transactionHash}
            networkType={network.type}
          >
            {transactionHash}
          </TransactionBadge>,
          <Amount
            css={`
              color: ${theme.positive};
            `}
          >
            {formattedAmount} {token.symbol}
          </Amount>,
          <span>{splitAllocation(denominationAllocation, pctBase)}</span>,
        ]
      }}
      onStatusEmptyClear={onClearFilters}
    />
  )
}

const Amount = styled.span`
  font-weight: 600;
`

export default PaymentsTable