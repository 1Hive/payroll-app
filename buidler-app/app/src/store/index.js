import { events } from '@aragon/api'
import app from './app'
import { getEmployeeById, getSalaryAllocation } from './employees'
import { getDenominationToken } from './tokens'
import { date, payment } from './marshalling'
import { addressesEqual } from '../utils/web3-utils'
import { take } from 'rxjs/operators'

export default function initialize(vaultAddress) {
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
      case 'AddEmployee':
        return onAddNewEmployee(nextState, returnValues)
      case 'ChangeAddressByEmployee':
        return onChangeEmployeeAddress(nextState, returnValues)
      case 'Payday':
        return onPayday(nextState, returnValues, transactionHash)
      case 'SetEmployeeSalary':
        return onSetEmployeeSalary(nextState, returnValues)
      case 'AddEmployeeAccruedSalary':
        return onAddEmployeeAccruedSalary(nextState, returnValues)
      case 'TerminateEmployee':
        return onTerminateEmployee(nextState, returnValues)
      default:
        return nextState
    }
  }

  const storeOptions = {
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

async function onPayday(state, returnValues, transactionHash) {
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
async function onAddEmployeeAccruedSalary(state, returnValues) {
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
