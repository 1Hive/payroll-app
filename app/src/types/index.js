import PropTypes from 'prop-types'

export const employeeType = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
  startDate: PropTypes.number,
  endDate: PropTypes.number,
  role: PropTypes.string,
  salary: PropTypes.object,
  accruedValue: PropTypes.number,
})

export const salaryType = PropTypes.shape({
  accountAddress: PropTypes.string,
  amount: PropTypes.object,
  date: PropTypes.number,
  exchangeRate: PropTypes.object,
  status: PropTypes.string,
  transactionAddress: PropTypes.string,
})

export const MODE = {
  ADD_EMPLOYEE: Symbol('ADD_EMPLOYEE'),
  EDIT_EQUITY: Symbol('EDIT_EQUITY'),
  PAYDAY: Symbol('PAYDAY'),
  TERMINATE_EMPLOYEE: Symbol('TERMINATE_EMPLOYEE'),
}
