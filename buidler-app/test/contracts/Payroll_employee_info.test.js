const { assertRevert } = require('../helpers/assertRevert')
const { getEventArgument } = require('@aragon/test-helpers/events')
const { annualSalaryPerSecond } = require('../helpers/numbers')(web3)
const { MAX_UINT256, MAX_UINT64, ONE, bn } = require('../helpers/numbers')(web3)
const { NOW, ONE_MONTH } = require('../helpers/time')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)
const { deployDAI } = require('../helpers/tokens')(artifacts, web3)

contract('Payroll employee info', ([owner, employee]) => {
  let dao, payroll, payrollBase, finance, vault, DAI, equityTokenManager

  const currentTimestamp = async () => payroll.getTimestampPublic()

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager } = await deployContracts(owner))
    DAI = await deployDAI(owner, finance)
  })

  beforeEach('create payroll and price feed instance', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
  })

  describe('getEmployee', () => {
    context('when it has already been initialized', () => {
      beforeEach('initialize payroll app using DAI as denomination token', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
      })

      context('when the given id exists', () => {
        let employeeId
        const salary = annualSalaryPerSecond(100000)

        beforeEach('add employee', async () => {
          const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss', { from: owner })
          employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId').toString()
        })

        it('adds a new employee', async () => {
          const { accountAddress, denominationSalary, accruedSalary, lastPayroll, endDate } = await payroll.getEmployee(employeeId)

          assert.equal(accountAddress, employee, 'employee address does not match')
          assert.equal(denominationSalary.toString(), salary.toString(), 'employee salary does not match')
          assert.equal(accruedSalary.toString(), 0, 'employee accrued salary does not match')
          assert.equal(lastPayroll.toString(), (await currentTimestamp()).toString(), 'employee last payroll does not match')
          assert.equal(endDate.toString(), MAX_UINT64, 'employee end date does not match')
        })
      })

      context('when the given id does not exist', () => {
        const employeeId = 0

        it('reverts', async () => {
          await assertRevert(payroll.getEmployee(employeeId), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')
        })
      })
    })

    context('when it has not been initialized yet', () => {
      const employeeId = 0

      it('reverts', async () => {
        await assertRevert(payroll.getEmployee(employeeId), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')
      })
    })
  })

  describe('getEmployeeIdByAddress', () => {
    context('when it has already been initialized', () => {
      beforeEach('initialize payroll app using DAI as denomination token', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
      })

      context('when the given address exists', () => {
        let employeeId
        const address = employee
        const salary = annualSalaryPerSecond(100000)

        beforeEach('add employee', async () => {
          const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss', { from: owner })
          employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId')
        })

        it('returns the id of the requested employee', async () => {
          const id = await payroll.getEmployeeIdByAddress(address)
          const { accountAddress } = await payroll.getEmployee(id)

          assert.equal(id.toString(), employeeId.toString(), 'employee id does not match')
          assert.equal(accountAddress, address, 'employee address does not match')
        })
      })

      context('when the given id does not exist', () => {
        it('reverts', async () => {
          await assertRevert(payroll.getEmployeeIdByAddress(employee), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')
        })
      })
    })

    context('when it has not been initialized yet', () => {
      it('reverts', async () => {
        await assertRevert(payroll.getEmployeeIdByAddress(employee), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')
      })
    })
  })

  describe('getTotalOwedSalary', () => {
    context('when it has already been initialized', () => {
      beforeEach('initialize payroll app using DAI as denomination token', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
      })

      context('when the given id exists', () => {
        let employeeId
        const salary = annualSalaryPerSecond(100000)

        beforeEach('add employee', async () => {
          const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss', { from: owner })
          employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId')
        })

        context('when the employee does not have owed salary', () => {
          it('returns zero', async () => {
            assert.equal((await payroll.getTotalOwedSalary(employeeId)).toString(), 0, 'total owed salary does not match')
          })
        })

        context('when the employee has some owed salary', () => {
          beforeEach('accumulate some payroll', async () => {
            await payroll.mockIncreaseTime(ONE_MONTH)
          })

          context('when the employee does not have any other owed amount', () => {
            it('returns the owed payroll', async () => {
              const expectedOwedSalary = salary.mul(bn(ONE_MONTH))
              assert.equal((await payroll.getTotalOwedSalary(employeeId)).toString(), expectedOwedSalary.toString(), 'total owed salary does not match')
            })
          })

          context('when the employee has some accrued salary', () => {
            context('when the total owed amount does not overflow', () => {
              beforeEach('add accrued salary', async () => {
                await payroll.setEmployeeSalary(employeeId, salary.mul(bn(2)), { from: owner })
                await payroll.mockIncreaseTime(ONE_MONTH)
              })

              it('returns the owed payroll plus the accrued salary', async () => {
                const expectedOwedSalary = salary.mul(bn(ONE_MONTH)).add(salary.mul(bn(2)).mul(bn(ONE_MONTH)))
                assert.equal((await payroll.getTotalOwedSalary(employeeId)).toString(), expectedOwedSalary.toString(), 'total owed salary does not match')
              })
            })

            context('when the total owed amount does overflow', () => {
              beforeEach('add accrued salary', async () => {
                await payroll.setEmployeeSalary(employeeId, MAX_UINT256, { from: owner })
                await payroll.mockIncreaseTime(1)
              })

              it('returns max uint256', async () => {
                assert.equal((await payroll.getTotalOwedSalary(employeeId)).toString(), MAX_UINT256.toString(), 'total owed salary does not match')
              })
            })
          })
        })
      })

      context('when the given id does not exist', () => {
        const employeeId = 0

        it('reverts', async () => {
          await assertRevert(payroll.getTotalOwedSalary(employeeId), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')
        })
      })
    })

    context('when it has not been initialized yet', () => {
      const employeeId = 0

      it('reverts', async () => {
        await assertRevert(payroll.getTotalOwedSalary(employeeId), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')
      })
    })
  })
})
