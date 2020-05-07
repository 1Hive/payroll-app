const Payroll = artifacts.require('Payroll')

contract('Payroll roles', () => {
  let payroll

  beforeEach('create new payroll instance', async () => {
    payroll = await Payroll.new()
  })

  describe('roles', () => {
    it('should implement role constants successfully', async () => {
      assert.equal(await payroll.ADD_EMPLOYEE_ROLE(), web3.utils.sha3('ADD_EMPLOYEE_ROLE'), 'add employee role does not match')
      assert.equal(await payroll.TERMINATE_EMPLOYEE_ROLE(), web3.utils.sha3('TERMINATE_EMPLOYEE_ROLE'), 'terminate employee role does not match')
      assert.equal(await payroll.SET_EMPLOYEE_SALARY_ROLE(), web3.utils.sha3('SET_EMPLOYEE_SALARY_ROLE'), 'set employee salary does not match')
      assert.equal(await payroll.SET_FINANCE_ROLE(), web3.utils.sha3('SET_FINANCE_ROLE'), 'set finance role does not match')
      assert.equal(await payroll.SET_DENOMINATION_TOKEN_ROLE(), web3.utils.sha3('SET_DENOMINATION_TOKEN_ROLE'), 'set denomination token role does not match')
      assert.equal(await payroll.SET_TOKEN_MANAGER_ROLE(), web3.utils.sha3('SET_TOKEN_MANAGER_ROLE'), 'set token manager role does not match')
      assert.equal(await payroll.SET_EQUITY_SETTINGS_ROLE(), web3.utils.sha3('SET_EQUITY_SETTINGS_ROLE'), 'set equity settings role does not match')
    })
  })
})
