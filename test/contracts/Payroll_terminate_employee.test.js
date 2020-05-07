const { assertRevert } = require('../helpers/assertRevert')
const { getEvents, getEventArgument } = require('@aragon/test-helpers/events')
const { NOW, ONE_MONTH } = require('../helpers/time')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)
const { bn, MAX_UINT64, annualSalaryPerSecond, ONE } = require('../helpers/numbers')(web3)
const { DAI_RATE, exchangedAmount, deployDAI } = require('../helpers/tokens')(artifacts, web3)

contract('Payroll employees termination', ([owner, employee, anyone]) => {
  let dao, payroll, payrollBase, finance, vault, DAI, equityTokenManager

  const currentTimestamp = async () => payroll.getTimestampPublic()

  const increaseTime = async seconds => {
    await payroll.mockIncreaseTime(seconds)
  }

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager } = await deployContracts(owner))
    DAI = await deployDAI(owner, finance)
  })

  beforeEach('create payroll and price feed instance', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
  })

  describe('terminateEmployee', () => {
    context('when it has already been initialized', function () {
      beforeEach('initialize payroll app using DAI as denomination token', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
      })

      context('when the given employee id exists', () => {
        let employeeId
        const salary = annualSalaryPerSecond(100000)

        beforeEach('add employee', async () => {
          const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss', { from: owner })
          employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId').toString()
        })

        context('when the sender has permissions to terminate employees', () => {
          const from = owner

          context('when the employee was not terminated', () => {
            let endDate

            context('when the given end date is in the future ', () => {
              beforeEach('set future end date', async () => {
                endDate = (await currentTimestamp()).add(bn(ONE_MONTH))
              })

              it('sets the end date of the employee', async () => {
                await payroll.terminateEmployee(employeeId, endDate, { from })

                const date = (await payroll.getEmployee(employeeId))[4]
                assert.equal(date.toString(), endDate.toString(), 'employee end date does not match')
              })

              it('emits an event', async () => {
                const receipt = await payroll.terminateEmployee(employeeId, endDate, { from })

                const events = getEvents(receipt, 'TerminateEmployee')
                assert.equal(events.length, 1, 'number of TerminateEmployee events does not match')

                const event  = events[0].args
                assert.equal(event.employeeId.toString(), employeeId, 'employee id does not match')
                assert.equal(event.endDate.toString(), endDate.toString(), 'employee end date does not match')
              })

              it('does not reset the owed salary nor the reimbursements of the employee', async () => {
                const previousDAI = await DAI.balanceOf(employee)

                // Accrue some salary and extras
                await increaseTime(ONE_MONTH)

                // Terminate employee and travel some time in the future
                await payroll.terminateEmployee(employeeId, endDate, { from })
                await increaseTime(ONE_MONTH - 1) // to avoid expire rates

                // Request owed money and remove terminated employee
                await payroll.payday(ONE, -1, "", { from: employee })
                await assertRevert(payroll.getEmployee(employeeId), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')

                const owedSalaryInDai = exchangedAmount(salary.mul(bn(ONE_MONTH)), DAI_RATE, 100)

                const currentDAI = await DAI.balanceOf(employee)
                const expectedDAI = previousDAI.add(owedSalaryInDai)
                assert.equal(currentDAI.toString(), expectedDAI.toString(), 'current balance does not match')
              })

              it('can re-add a removed employee', async () => {
                await increaseTime(ONE_MONTH)

                // Terminate employee and travel some time in the future
                await payroll.terminateEmployee(employeeId, endDate, { from })
                await increaseTime(ONE_MONTH - 1) // to avoid expire rates

                // Request owed money and remove terminated employee
                await payroll.payday(ONE, -1, "", { from: employee })
                await assertRevert(payroll.getEmployee(employeeId), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')

                // Add employee back
                const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss')
                const newEmployeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId')

                const { accountAddress, denominationSalary, accruedSalary, lastPayroll, endDate: end } = await payroll.getEmployee(newEmployeeId)
                assert.equal(accountAddress, employee, 'employee account does not match')
                assert.equal(denominationSalary.toString(), salary.toString(), 'employee salary does not match')
                assert.equal(accruedSalary.toString(), 0, 'employee accrued salary does not match')
                assert.equal(lastPayroll.toString(), (await currentTimestamp()).toString(), 'employee last payroll date does not match')
                assert.equal(end.toString(), MAX_UINT64, 'employee end date does not match')
              })
            })

            context('when the given end date is in the past', () => {
              beforeEach('set future end date', async () => {
                endDate = await currentTimestamp()
                await increaseTime(ONE_MONTH + 1)
              })

              it('reverts', async () => {
                await assertRevert(payroll.terminateEmployee(employeeId, endDate, { from }), 'PAYROLL_PAST_TERMINATION_DATE')
              })
            })
          })

          context('when the employee end date was already set', () => {
            beforeEach('terminate employee', async () => {
              await payroll.terminateEmployee(employeeId, (await currentTimestamp()).add(bn(ONE_MONTH)), { from })
            })

            context('when the previous end date was not reached yet', () => {
              it('changes the employee end date', async () => {
                const newEndDate = bn(await currentTimestamp()).add(bn(ONE_MONTH * 2))
                await payroll.terminateEmployee(employeeId, newEndDate, { from })

                const endDate = (await payroll.getEmployee(employeeId))[4]
                assert.equal(endDate.toString(), newEndDate.toString(), 'employee end date does not match')
              })
            })

            context('when the previous end date was reached', () => {
              beforeEach('travel in the future', async () => {
                await increaseTime(ONE_MONTH + 1)
              })

              it('reverts', async () => {
                await assertRevert(payroll.terminateEmployee(employeeId, await currentTimestamp(), { from }), 'PAYROLL_NON_ACTIVE_EMPLOYEE')
              })
            })
          })
        })

        context('when the sender does not have permissions to terminate employees', () => {
          const from = anyone

          it('reverts', async () => {
            await assertRevert(payroll.terminateEmployee(employeeId, await currentTimestamp(), { from }), 'APP_AUTH_FAILED')
          })
        })
      })

      context('when the given employee id does not exist', () => {
        const employeeId = 0

        it('reverts', async () => {
          await assertRevert(payroll.terminateEmployee(employeeId, await currentTimestamp(), { from: owner }), 'PAYROLL_NON_ACTIVE_EMPLOYEE')
        })
      })
    })

    context('when it has not been initialized yet', function () {
      const employeeId = 0
      const endDate = NOW + ONE_MONTH

      it('reverts', async () => {
        await assertRevert(payroll.terminateEmployee(employeeId, endDate, { from: owner }), 'APP_AUTH_FAILED')
      })
    })
  })
})
