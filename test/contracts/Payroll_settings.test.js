const { deployDAI } = require('../helpers/tokens')(artifacts, web3)
const { getEvents } = require('@aragon/test-helpers/events')
const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { NOW, ONE_MINUTE, RATE_EXPIRATION_TIME } = require('../helpers/time')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('Payroll settings', ([owner, anyone]) => {
  let dao, payroll, payrollBase, finance, vault, equityTokenManager, DAI

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager } = await deployContracts(owner))
    DAI = await deployDAI(owner, finance)
  })

  beforeEach('create payroll', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
    await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, 1, 0, 0, false, { from: owner })
  })

  // setFinance
  // setDenominationToken
  // setEquityTokenManager
  // setEquityMultiplier
  // setVestingSettings

  describe('setDenominationToken', () => {

    it('sets correctly', async () => {
      const DAINew = await deployDAI(owner, finance)
      await payroll.setDenominationToken(DAINew.address)
      const newDenominationToken = await payroll.denominationToken()
      assert.equal(DAINew.address, newDenominationToken)
    })
  })

})
