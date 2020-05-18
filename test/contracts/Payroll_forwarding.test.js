const { assertRevert } = require('../helpers/assertRevert')
const { getEventArgument } = require('@aragon/test-helpers/events')
const { encodeCallScript } = require('@aragon/test-helpers/evmScript')
const { annualSalaryPerSecond, bn, ONE } = require('../helpers/numbers')(web3)
const { deployDAI } = require('../helpers/tokens')(artifacts, web3)
const { NOW, ONE_MONTH } = require('../helpers/time')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)

const ExecutionTarget = artifacts.require('ExecutionTarget')

contract('Payroll forwarding', ([owner, employee, anyone]) => {
  let dao, payroll, payrollBase, finance, vault, DAI, equityTokenManager

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager } = await deployContracts(owner))
    DAI = await deployDAI(owner, finance)
  })

  beforeEach('create payroll and price feed instance', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
  })

  describe('isForwarder', () => {
    context('when it has already been initialized', function () {
      beforeEach('initialize payroll app using DAI as denomination token', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
      })

      it('returns true', async () => {
        assert(await payroll.isForwarder(), 'should be a forwarder')
      })
    })

    context('when it has not been initialized yet', function () {
      it('returns true', async () => {
        assert(await payroll.isForwarder(), 'should be a forwarder')
      })
    })
  })

  describe('canForward', () => {
    context('when it has already been initialized', function () {
      beforeEach('initialize payroll app using DAI as denomination token', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
      })

      context('when the sender is an employee', () => {
        let employeeId
        const sender = employee

        beforeEach('add employee', async () => {
          const receipt = await payroll.addEmployee(employee, annualSalaryPerSecond(100000), await payroll.getTimestampPublic(), 'Boss', { from: owner })
          employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId').toString()
        })

        context('when the employee was not terminated', () => {
          it('returns true', async () =>  {
            assert(await payroll.canForward(sender, '0x'), 'sender should be able to forward')
          })
        })

        context('when the employee has termination date', () => {
          const timeUntilTermination = ONE_MONTH + 1

          beforeEach('terminate employee', async () => {
            const terminationDate = (await payroll.getTimestampPublic()).add(bn(timeUntilTermination))
            await payroll.terminateEmployee(employeeId, terminationDate, { from: owner })
          })

          context('when the termination date has not been reached', () => {
            beforeEach('increase time to before termination date', async () => {
              await payroll.mockIncreaseTime(timeUntilTermination)
            })

            it('returns true', async () => {
              assert(await payroll.canForward(sender, '0x'), 'sender should be able to forward')
            })
          })

          context('when the termination date has been reached', () => {
            beforeEach('increase time to after termination date', async () => {
              await payroll.mockIncreaseTime(timeUntilTermination + 1)
            })

            it('returns false', async () => {
              assert.isFalse(await payroll.canForward(sender, '0x'), 'sender should not be able to forward')
            })
          })
        })
      })

      context('when the sender is not an employee', () => {
        const sender = anyone

        it('returns false', async () =>  {
          assert.isFalse(await payroll.canForward(sender, '0x'), 'sender should not be able to forward')
        })
      })
    })

    context('when it has not been initialized yet', function () {
      it('returns false', async () =>  {
        assert.isFalse(await payroll.canForward(employee, '0x'), 'sender should not be able to forward')
      })
    })
  })

  describe('forward', () => {
    let executionTarget, script

    context('When the execution target is black listed', function() {
      const from = employee
    
      beforeEach('initialize payroll app and add employee', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
        await payroll.addEmployee(employee, annualSalaryPerSecond(100000), await payroll.getTimestampPublic(), 'Boss', { from: owner })
      })
    
      context('Execution target is finance', function () {
        beforeEach('build script', async () => {
          executionTarget = await ExecutionTarget.new()
          const action = { to: finance.address, calldata: finance.contract.methods.setPeriodDuration(0).encodeABI() }
          script = encodeCallScript([action])
        })
    
        it('reverts', async () =>  {
          await assertRevert(payroll.forward(script, { from }), 'EVMCALLS_BLACKLISTED_CALL')
        })
      })
    
      context('Execution target is equity token manager', function () {
        beforeEach('build script', async () => {
          executionTarget = await ExecutionTarget.new()
          const action = { to: equityTokenManager.address, calldata: equityTokenManager.contract.methods.issue('0').encodeABI() }
          script = encodeCallScript([action])
        })
    
        it('reverts', async () =>  {
          await assertRevert(payroll.forward(script, { from }), 'EVMCALLS_BLACKLISTED_CALL')
        })
      })
    })

    context('When the execution target is not black listed', function() {
      beforeEach('build script', async () => {
        executionTarget = await ExecutionTarget.new()
        const action = { to: executionTarget.address, calldata: executionTarget.contract.methods.execute().encodeABI() }
        script = encodeCallScript([action])
      })

      context('when it has already been initialized', function () {
        beforeEach('initialize payroll app using DAI as denomination token', async () => {
          await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
        })

        context('when the sender is an employee', () => {
          let employeeId
          const from = employee

          beforeEach('add employee', async () => {
            const receipt = await payroll.addEmployee(employee, annualSalaryPerSecond(100000), await payroll.getTimestampPublic(), 'Boss', { from: owner })
            employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId').toString()
          })

          context('when the employee was not terminated', () => {
            it('executes the given script', async () =>  {
              await payroll.forward(script, { from })

              assert.equal(await executionTarget.counter(), 1, 'should have received execution calls')
            })
          })

          context('when the employee has termination date', () => {
            const timeUntilTermination = ONE_MONTH + 1

            beforeEach('terminate employee', async () => {
              const terminationDate = (await payroll.getTimestampPublic()).add(bn(timeUntilTermination))
              await payroll.terminateEmployee(employeeId, terminationDate, { from: owner })
            })

            context('when the termination date has not been reached', () => {
              beforeEach('increase time to before termination date', async () => {
                await payroll.mockIncreaseTime(timeUntilTermination)
              })

              it('executes the given script', async () =>  {
                await payroll.forward(script, { from })

                assert.equal(await executionTarget.counter(), 1, 'should have received execution calls')
              })
            })

            context('when the termination date has been reached', () => {
              beforeEach('increase time to after termination date', async () => {
                await payroll.mockIncreaseTime(timeUntilTermination + 1)
              })

              it('reverts', async () =>  {
                await assertRevert(payroll.forward(script, { from }), 'PAYROLL_CAN_NOT_FORWARD')

                assert.equal(await executionTarget.counter(), 0, 'should not have received execution calls')
              })
            })
          })
        })

        context('when the sender is not an employee', () => {
          const from = anyone

          it('reverts', async () =>  {
            await assertRevert(payroll.forward(script, { from }), 'PAYROLL_CAN_NOT_FORWARD')

            assert.equal(await executionTarget.counter(), 0, 'should not have received execution calls')
          })
        })
      })

      context('when it has not been initialized yet', function () {
        it('reverts', async () => {
          await assertRevert(payroll.forward(script, { from: employee }), 'PAYROLL_CAN_NOT_FORWARD')
        })
      })
    })
  })
})
