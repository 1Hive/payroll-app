import { events } from '@aragon/api'
import app from './app'
import { getEmployeeById, getSalaryAllocation } from './employees'
import { getDenominationToken, getToken } from './tokens'
import { date, payment } from './marshalling'
import { addressesEqual } from '../utils/web3-utils'
import { take } from 'rxjs/operators'
// import financeEvents from '../abi/finance-events'

export default function initialize(vaultAddress) {
  // const financeApp = api.external(financeAddress, financeEvents)

  async function reducer(state, { event, returnValues, transactionHash }) {
    const nextState = {
      ...state,
    }

    switch (event) {
      case events.ACCOUNTS_TRIGGER:
        return onChangeAccount(nextState, returnValues)
      case events.SYNC_STATUS_SYNCING:
        return { ...nextState, isSyncing: true }
      case events.SYNC_STATUS_SYNCED:
        return { ...nextState, isSyncing: false }
      case 'SetAllowedToken':
        return onSetAllowedToken(nextState, returnValues)
      case 'AddEmployee':
        return onAddNewEmployee(nextState, returnValues)
      case 'ChangeAddressByEmployee':
        return onChangeEmployeeAddress(nextState, returnValues)
      case 'DetermineAllocation':
        return onChangeSalaryAllocation(nextState, returnValues)
      case 'SetPriceFeed':
        return onSetPriceFeed(nextState, returnValues)
      case 'SendPayment':
        return onSendPayment(nextState, returnValues, transactionHash)
      case 'SetEmployeeSalary':
        return onSetEmployeeSalary(nextState, returnValues)
      case 'AddEmployeeAccruedValue':
        return onAddEmployeeAccruedValue(nextState, returnValues)
      case 'TerminateEmployee':
        return onTerminateEmployee(nextState, returnValues)
      default:
        return nextState
    }
  }

  const storeOptions = {
    // externals: [{ contract: financeApp }],
    init: initState({ vaultAddress }),
  }
  return app.store(reducer, storeOptions)
}

function initState({ vaultAddress }) {
  return async cachedState => {
    try {
      const [denominationToken, network] = await Promise.all([
        getDenominationToken(),
        app
          .network()
          .pipe(take(1))
          .toPromise(),
      ])

      const initialState = {
        ...cachedState,
        vaultAddress,
        denominationToken,
        network,
      }
      return initialState
    } catch (e) {
      console.error(e)
    }
  }
}

async function onChangeAccount(state, { account }) {
  const { tokens = [], employees = [] } = state
  let salaryAllocation = []

  const employee = employees.find(employee =>
    addressesEqual(employee.accountAddress, account)
  )

  if (employee) {
    salaryAllocation = await getSalaryAllocation(employee.id, tokens)
  }

  return { ...state, salaryAllocation }
}

async function onSetAllowedToken(state, { token: tokenAddress, allowed }) {
  const { tokens = [] } = state

  const foundToken = tokens.find(t => addressesEqual(t.address, tokenAddress))

  if (foundToken && !allowed) {
    tokens.splice(tokens.indexOf(foundToken), 1)
  } else if (!foundToken && allowed) {
    const token = await getToken(tokenAddress)

    if (token) {
      tokens.push(token)
    }
  }

  return { ...state, tokens }
}

async function onAddNewEmployee(state, { employeeId, name, role, startDate }) {
  const { employees = [] } = state

  if (!employees.find(e => e.id === employeeId)) {
    const newEmployee = await getEmployeeById(employeeId)

    if (newEmployee) {
      employees.push({
        ...newEmployee,
        name: name,
        role: role,
        startDate: date(startDate),
      })
    }
  }

  return { ...state, employees }
}

async function onChangeEmployeeAddress(state, { newAddress: accountAddress }) {
  const { tokens = [], employees = [] } = state
  let salaryAllocation = []

  const employee = employees.find(employee =>
    addressesEqual(employee.accountAddress, accountAddress)
  )

  if (employee) {
    salaryAllocation = await getSalaryAllocation(employee.id, tokens)
  }

  return { ...state, salaryAllocation }
}

async function onChangeSalaryAllocation(state, { employee: accountAddress }) {
  const { tokens = [], employees = [] } = state
  let salaryAllocation = []

  const employee = employees.find(employee =>
    addressesEqual(employee.accountAddress, accountAddress)
  )

  if (employee) {
    salaryAllocation = await getSalaryAllocation(employee.id, tokens)
  }

  return { ...state, salaryAllocation }
}

function onSetPriceFeed(state, { feed: priceFeedAddress }) {
  return { ...state, priceFeedAddress }
}

async function onSendPayment(state, returnValues, transactionHash) {
  const employees = await updateEmployeeById(state, returnValues)
  const { tokens } = state
  const { token, employeeId } = returnValues
  const payments = state.payments || []

  const paymentExists = payments.some(payment => {
    const { transactionAddress, amount } = payment
    const transactionExists = transactionAddress === transactionHash
    const withSameToken = addressesEqual(amount.token.address, token)
    return transactionExists && withSameToken
  })

  if (!paymentExists) {
    const transactionToken = tokens.find(_token =>
      addressesEqual(_token.address, token)
    )
    const employee = employees.find(_employee => +_employee.id === +employeeId)
    const currentPayment = payment({
      returnValues,
      transactionHash,
      token: transactionToken,
      employee: employee.accountAddress,
    })
    payments.push(currentPayment)
  }

  return { ...state, employees, payments }
}

async function onSetEmployeeSalary(state, returnValues) {
  const employees = await updateEmployeeById(state, returnValues)
  return { ...state, employees }
}
async function onAddEmployeeAccruedValue(state, returnValues) {
  const employees = await updateEmployeeById(state, returnValues)
  return { ...state, employees }
}
async function onTerminateEmployee(state, returnValues) {
  const employees = await updateEmployeeById(state, returnValues)
  return { ...state, employees }
}

async function updateEmployeeById(state, { employeeId }) {
  const { employees: prevEmployees } = state
  const employeeData = await getEmployeeById(employeeId)

  const byId = employee => employee.id === employeeId
  return updateEmployeeBy(prevEmployees, employeeData, byId)
}

function updateEmployeeBy(employees, employeeData, by) {
  let nextEmployees = [...employees]

  if (!nextEmployees.find(by)) {
    nextEmployees.push(employeeData)
  } else {
    nextEmployees = nextEmployees.map(employee => {
      let nextEmployee = {
        ...employee,
      }

      if (by(employee)) {
        nextEmployee = {
          ...employeeData,
          name: employee.name,
          role: employee.role,
          startDate: employee.startDate,
        }
      }
      return nextEmployee
    })
  }

  return nextEmployees
}
