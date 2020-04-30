import React, { useState } from 'react'
import styled from 'styled-components'
import { useAragonApi } from '@aragon/api-react'
import { Box } from '@aragon/ui'

import SalaryTable from './SalaryTable'
import TokenFilter from './filters/TokenFilter'
import DateRangeFilter from './filters/DateRangeFilter'
import { formatCurrency } from '../../utils/formatting'

const PreviousSalary = props => {
  const { appState, network, connectedAccount } = useAragonApi()
  const {
    salaryAllocation = [],
    payments = [],
    denominationToken = [],
  } = appState

  const [tokenFilter, setTokenFilter] = useState()
  const [dateRangeFilter, setDateRangeFilter] = useState()
  const filteredPayments = payments.filter(
    payment => payment.accountAddress === connectedAccount
  )

  const customExchangedFormat = exchanged =>
    formatCurrency(exchanged, denominationToken.symbol, 10, 0)
  const customTokenAmountFormat = amount =>
    formatCurrency(
      amount.amount,
      amount.token.symbol,
      10,
      amount.token.decimals,
      1,
      2,
      true,
      true
    )

  const tokenFilterOptions = salaryAllocation.map(option => {
    return {
      label: option.symbol,
      filter: salary => salary.amount.token.address === option.address,
    }
  })

  const filters = [
    ...(tokenFilter && tokenFilter.filter ? [tokenFilter.filter] : []),
    ...(dateRangeFilter && dateRangeFilter.filter
      ? [dateRangeFilter.filter]
      : []),
  ]

  const handleClearFilters = () => {
    // this.setState({
    //   statusFilter: null,
    //   roleFilter: null,
    // })
  }

  const handleTokenFilterChange = tokenFilter => {
    setTokenFilter(tokenFilter)
  }

  const handleDateRangeFilterChange = dateRangeFilter => {
    setDateRangeFilter(dateRangeFilter)
  }

  return (
    <Box heading="Previous Salary">
      <StyledFilters>
        <DateRangeFilter
          active={dateRangeFilter}
          onChange={handleDateRangeFilterChange}
        />
        <TokenFilter
          active={tokenFilter}
          onChange={handleTokenFilterChange}
          options={tokenFilterOptions}
        />
      </StyledFilters>
      <SalaryTable
        data={filteredPayments}
        filters={filters}
        onClearFilters={handleClearFilters}
        formatExchanged={customExchangedFormat}
        formatTokenAmount={customTokenAmountFormat}
        network={network}
      />
    </Box>
  )
}

const StyledFilters = styled.div``

export default PreviousSalary
