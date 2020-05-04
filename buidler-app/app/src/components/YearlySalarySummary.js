import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useSpring, animated, config } from 'react-spring'
import { zip } from 'rxjs'
import { first, map } from 'rxjs/operators'
import { useAragonApi } from '@aragon/api-react'
import { theme, Text } from '@aragon/ui'
import vaultAbi from '../abi/vault-balance'
import priceFeedAbi from '../abi/price-feed'
import { formatCurrency } from '../utils/formatting'
import { SECONDS_IN_A_YEAR, dayjs } from '../utils/date-utils'

function YearlySalarySummary() {
  const { api, appState } = useAragonApi()
  const {
    employees = [],
    payments = [],
    denominationToken = {},
    vaultAddress = '',
    tokens = [],
    priceFeedAddress = '',
  } = appState

  const [cashReserves, setCashReserves] = useState(0)

  const formatAmount = amount => {
    return formatCurrency(
      amount,
      denominationToken.symbol,
      10,
      denominationToken.decimals
    )
  }

  const getSummary = () => {
    const totalYearSalaryBill =
      employees.reduce((acc, employee) => acc + employee.salary, 0) *
      SECONDS_IN_A_YEAR
    const today = dayjs()
    const yearAgo = dayjs(today).sub(1, 'year')
    const thisYearPayments = payments.filter(payment =>
      dayjs(payment.date).isBetween(yearAgo, today)
    )
    const totalPaidThisYear =
      thisYearPayments.reduce((acc, payment) => acc + payment.exchanged, 0) *
      Math.pow(10, denominationToken.decimals)
    const remainingThisYear = totalYearSalaryBill - totalPaidThisYear

    return {
      totalYearSalaryBill: formatAmount(totalYearSalaryBill),
      totalPaidThisYear: formatAmount(totalPaidThisYear),
      remainingThisYear: formatAmount(remainingThisYear),
    }
  }

  useEffect(() => {
    ;(async () => {
      const vault = api.external(vaultAddress, vaultAbi)
      const priceFeed = api.external(priceFeedAddress, priceFeedAbi)

      const balances = await Promise.all(
        tokens.map(token => {
          return zip(
            vault.balance(token.address).pipe(first()),
            priceFeed
              .get(denominationToken.address, token.address)
              .pipe(first())
          )
            .pipe(first())
            .pipe(
              map(([amount, { xrt }]) => {
                const exchangedAmount = amount / xrt
                return {
                  ...token,
                  exchangedAmount,
                }
              })
            )
            .toPromise()
        })
      )

      const cashReserves = balances.reduce((acc, balance) => {
        return acc + balance.exchangedAmount
      }, 0)

      setCashReserves(cashReserves)
    })()
  }, [vaultAddress])

  let summary
  if (employees && payments) {
    summary = getSummary()
  }

  return (
    <Container>
      <SummaryTitle>Yearly salary summary</SummaryTitle>
      <SummaryRow>
        <SummaryItem>Salary paid this year</SummaryItem>
        {summary ? (
          <SummaryAmount>{summary.totalPaidThisYear}</SummaryAmount>
        ) : (
          <Loading />
        )}
      </SummaryRow>
      <SummaryRow>
        <SummaryItem>Remaining salary this year</SummaryItem>
        {summary ? (
          <SummaryAmount>{summary.remainingThisYear}</SummaryAmount>
        ) : (
          <Loading />
        )}
      </SummaryRow>

      <Line />

      <SummaryRow>
        <SummaryItem>Total year salary bill</SummaryItem>
        {summary ? (
          <SummaryAmount>{summary.totalYearSalaryBill}</SummaryAmount>
        ) : (
          <Loading />
        )}
      </SummaryRow>
      <SummaryRow>
        <SummaryItem>Cash reserves</SummaryItem>
        {cashReserves ? (
          <AnimatedCashReserves
            cashReserves={cashReserves}
            symbol={denominationToken.symbol}
          />
        ) : (
          <Loading />
        )}
      </SummaryRow>
    </Container>
  )
}

const Container = styled.section`
  display: flex;
  flex-direction: column;
`
const SummaryTitle = styled(Text).attrs({ size: 'large' })`
  font-weight: 600;
  margin-bottom: 10px;
`
const SummaryRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`

const SummaryItem = styled(Text).attrs({
  size: 'large',
  color: theme.textSecondary,
})``

const SummaryAmount = styled(Text).attrs({ size: 'normal' })`
  font-weight: 600;
`

const Line = styled.div`
  padding-top: 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid ${theme.contentBorder};
  width: 100%;
`

const Loading = styled(Text).attrs({
  size: 'normal',
  color: theme.textTertiary,
})`
  &::before {
    content: 'Loading ...';
  }
`

const CashReserves = styled(SummaryAmount)`
  color: ${theme.positive};
`

const AnimatedCashReserves = props => {
  const { symbol, cashReserves } = props
  const format = amount =>
    formatCurrency(amount, symbol, 10, 0, 1, 2, true, true)
  const { number } = useSpring({
    from: { number: 0 },
    number: cashReserves,
    config: config.stiff,
  })

  return (
    <CashReserves>
      <animated.div>{number.interpolate(n => format(n))}</animated.div>
    </CashReserves>
  )
}

export default YearlySalarySummary
