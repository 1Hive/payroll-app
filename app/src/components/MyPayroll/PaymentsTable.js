import React, { useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { useNetwork, useAppState } from '@aragon/api-react'
import {
  blockExplorerUrl,
  ContextMenu,
  ContextMenuItem,
  DataView,
  GU,
  IconToken,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui'
import PaymentFilters from './PaymentFilters'
import { dateFormat } from '../../utils/date-utils'
import {
  formatTokenAmount,
  formatAllocationSplit,
} from '../../utils/formatting'

const columns = ['Date', 'Base asset', 'Split percentage (Base/Equity)']

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
      onStatusEmptyClear={onClearFilters}
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
          <Amount
            css={`
              color: ${theme.positive};
            `}
          >
            {formattedAmount} {token.symbol}
          </Amount>,
          <span>{formatAllocationSplit(denominationAllocation, pctBase)}</span>,
        ]
      }}
      renderEntryActions={({ transactionHash }) => (
        <ContextMenu zIndex={1}>
          <ContextMenuViewTransaction transactionHash={transactionHash} />
        </ContextMenu>
      )}
    />
  )
}

const ContextMenuViewTransaction = ({ transactionHash }) => {
  const theme = useTheme()
  const network = useNetwork()
  const handleViewTransaction = useCallback(() => {
    if (network && network.type) {
      window.open(
        blockExplorerUrl('transaction', transactionHash, {
          networkType: network.type,
        }),
        '_blank',
        'noopener'
      )
    }
  }, [network, transactionHash])

  return (
    <ContextMenuItem onClick={handleViewTransaction}>
      <IconToken
        css={`
          color: ${theme.surfaceContentSecondary};
        `}
      />
      <span
        css={`
          margin-left: ${1 * GU}px;
        `}
      >
        View transaction
      </span>
    </ContextMenuItem>
  )
}

const Amount = styled.span`
  font-weight: 600;
`

export default PaymentsTable
