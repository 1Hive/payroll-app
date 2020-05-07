import { events } from '@aragon/api'
import app from './app'
import { getEmployeeById, getSalaryAllocation } from './employees'
import { getDenominationToken, getEquityTokenManager, getToken } from './tokens'
import { date, payment } from './marshalling'
import { addressesEqual } from '../utils/web3-utils'

export default function initialize(vaultAddress) {
  async function reducer(
    state,
    { event, returnValues, transactionHash, blockNumber }
  ) {
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
        return onPayday(nextState, returnValues, transactionHash, blockNumber)
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

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function initState({ vaultAddress }) {
  return async cachedState => {
    try {
      const [
        denominationToken,
        equityTokenAddress,
        pctBase,
        equityMultiplier,
        vestingLength,
        vestingCliffLength,
      ] = await Promise.all([
        getDenominationToken(),
        getEquityTokenManager(),
        app.call('PCT_BASE').toPromise(),
        app.call('equityMultiplier').toPromise(),
        app.call('vestingLength').toPromise(),
        app.call('vestingCliffLength').toPromise(),
      ])

      const initialState = {
        ...cachedState,
        denominationToken,
        equityMultiplier,
        equityTokenAddress,
        pctBase,
        vaultAddress,
        vestingLength,
        vestingCliffLength,
      }
      return initialState
    } catch (e) {
      console.error(e)
    }
  }
}

async function onChangeAccount(state, { account }) {
  return { ...state }
}

async function onAddNewEmployee(state, { employeeId, role, startDate }) {
  const { employees = [] } = state

  if (!employees.find(e => e.id === employeeId)) {
    const newEmployee = await getEmployeeById(employeeId)

    if (newEmployee) {
      employees.push({
        ...newEmployee,
        role,
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

// TODO: Save amount in equity
async function onPayday(state, returnValues, transactionHash, blockNumber) {
  const { token } = returnValues
  const { denominationToken, payments = [] } = state
  const { timestamp } = await app.web3Eth('getBlock', blockNumber).toPromise()

  const employees = await updateEmployeeById(state, returnValues)

  const paymentExists = payments.some(payment => {
    const transactionExists = payment.transactionHash === transactionHash
    const withSameToken = addressesEqual(payment.token.address, token)
    return transactionExists && withSameToken
  })

  if (!paymentExists) {
    const currentPayment = payment({
      ...returnValues,
      transactionHash,
      paymentDate: timestamp,
      token: addressesEqual(token, denominationToken.address)
        ? denominationToken
        : getToken(token),
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

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

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
          role: employee.role,
          startDate: employee.startDate,
        }
      }
      return nextEmployee
    })
  }

  return nextEmployees
}