import React, { useState, useEffect } from 'react'
import { differenceInSeconds } from 'date-fns'
import AvailableSalaryTable from './AvailableSalaryTable'

import { formatCurrency, SECONDS_IN_A_YEAR } from '../../utils/formatting'
import { summation } from '../../utils/calculations'

import { useAragonApi } from '@aragon/api-react'
import { Box } from '@aragon/ui'

const AVAILABLE_BALANCE_TICK = 10000
//
// class AvailableSalary extends React.PureComponent {
//   static defaultProps = {
//     lastPayroll: Date.now(),
//     availableBalance: 0,
//     totalTransferred: 0,
//     salary: 0,
//   }
//
//   state = {
//     denominationToken: {
//       symbol: '',
//       decimals: 0,
//     },
//     data: [],
//   }
//
//   getEmployee(addr) {
//     return (
//       this.props.employees &&
//       this.props.employees.find(employee => employee.accountAddress === addr)
//     )
//   }
//
//   sumExchanged(payments, accountAddress) {
//     const field = 'exchanged'
//     const filter = e => e.accountAddress === accountAddress
//     const totalTransferred = summation(payments.filter(filter), field)
//     return totalTransferred
//   }
//
//   getAvailableBalance(employee, denominationToken) {
//     const accruedTime = differenceInSeconds(
//       new Date(),
//       new Date(employee.lastPayroll)
//     )
//     const accruedSalary = accruedTime * employee.salary + employee.accruedValue
//     return accruedSalary
//   }
//
//   getAvailableSalaryData(state, props, updateAll) {
//     const { payments, accountAddress, denominationToken } = props
//     const employee = this.getEmployee(accountAddress)
//     const availableBalance = this.getAvailableBalance(
//       employee,
//       denominationToken
//     )
//
//     const totalTransferred = updateAll
//       ? this.sumExchanged(payments, accountAddress)
//       : state.data[0].totalTransferred
//
//     const { lastPayroll, salary } = employee
//     const data = [{ lastPayroll, salary, totalTransferred, availableBalance }]
//     return data
//   }
//
//   componentDidUpdate(prevProps) {
//     if (this.props.accountAddress !== prevProps.accountAddress) {
//       clearInterval(this.interval)
//       this.interval = setInterval(() => {
//         this.setState((state, props) => {
//           const data = this.getAvailableSalaryData(state, props, false)
//           return { data }
//         })
//       }, AVAILABLE_BALANCE_TICK)
//     }
//
//     if (
//       this.props.accountAddress !== prevProps.accountAddress ||
//       (this.props.payments &&
//         prevProps.payments &&
//         this.props.payments.length !== prevProps.payments.length)
//     ) {
//       this.setState((state, props) => {
//         const { denominationToken } = props
//         const data = this.getAvailableSalaryData(state, props, true)
//         return { data, denominationToken }
//       })
//     }
//   }
//
//   componentWillUnmount() {
//     clearInterval(this.interval)
//   }
//
//   render() {
//     const { data, denominationToken } = this.state
//     const formatSalary = amount =>
//       formatCurrency(
//         amount,
//         denominationToken.symbol,
//         10,
//         denominationToken.decimals,
//         SECONDS_IN_A_YEAR
//       )
//     const customFormatCurrency = amount =>
//       formatCurrency(amount, denominationToken.symbol, 10, 0)
//     const formatTokenAmount = amount =>
//       formatCurrency(
//         amount,
//         denominationToken.symbol,
//         10,
//         denominationToken.decimals,
//         1,
//         2,
//         true,
//         true
//       )
//     return (
//       <Container>
//         <Header>
//           <Section.Title>Available Salary</Section.Title>
//         </Header>
//         <AvailableSalaryTable
//           data={data}
//           formatSalary={formatSalary}
//           formatCurrency={customFormatCurrency}
//           formatTokenAmount={formatTokenAmount}
//         />
//       </Container>
//     )
//   }
// }
//
// const Container = styled.section`
//   display: flex;
//   flex-direction: column;
//   align-items: stretch;
//   margin-bottom: 2em;
// `
//
// const Header = styled.div`
//   display: flex;
//   justify-content: space-between;
// `
//
// function mapStateToProps({
//   employees = [],
//   accountAddress = [],
//   denominationToken = [],
//   salaryAllocation = [],
//   payments = [],
// }) {
//   return {
//     employees,
//     accountAddress,
//     denominationToken,
//     salaryAllocation,
//     payments,
//   }
// }

const AvailableSalary = props => {
  const { appState, connectedAccount } = useAragonApi()
  const {
    employees = [],
    denominationToken: { symbol, decimals } = { symbol: '', decimals: 0 },
    // salaryAllocation = [],
    payments = [],
  } = appState

  function getEmployee(addr) {
    return (
      employees && employees.find(employee => employee.accountAddress === addr)
    )
  }

  function sumExchanged() {
    const field = 'exchanged'
    const filter = e => e.accountAddress === connectedAccount
    const totalTransferred = summation(payments.filter(filter), field)
    return totalTransferred
  }

  function getAvailableBalance(employee) {
    const accruedTime = differenceInSeconds(
      new Date(),
      new Date(employee.lastPayroll)
    )

    const accruedSalary = accruedTime * employee.salary + employee.accruedValue
    return accruedSalary
  }

  function getAvailableSalaryData(employee, updateAll) {
    const availableBalance = getAvailableBalance(employee)

    const totalTransferred = updateAll
      ? sumExchanged()
      : data[0].totalTransferred

    const { lastPayroll, salary } = employee
    return [{ lastPayroll, salary, totalTransferred, availableBalance }]
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const employee = getEmployee(connectedAccount)
      if (employee) {
        setData(getAvailableSalaryData(employee, false))
      }
    }, AVAILABLE_BALANCE_TICK)
    return () => clearInterval(interval)
  }, [connectedAccount])

  useEffect(() => {
    const employee = getEmployee(connectedAccount)
    if (employee) {
      setData(getAvailableSalaryData(employee, true))
    }
  }, [connectedAccount, payments.length, employees.length])

  const [data, setData] = useState([])
  console.log(data, appState, props)
  const formatSalary = amount =>
    formatCurrency(amount, symbol, 10, decimals, SECONDS_IN_A_YEAR)
  const customFormatCurrency = amount => formatCurrency(amount, symbol, 10, 0)
  const formatTokenAmount = amount =>
    formatCurrency(amount, symbol, 10, decimals, 1, 2, true, true)
  return (
    <Box headeing="Available Salary">
      <AvailableSalaryTable
        data={data}
        formatSalary={formatSalary}
        formatCurrency={customFormatCurrency}
        formatTokenAmount={formatTokenAmount}
      />
    </Box>
  )
}

export default AvailableSalary
