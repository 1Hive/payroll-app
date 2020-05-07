const { assertRevert } = require('../helpers/assertRevert')
const { assertAmountOfEvents } = require('@aragon/test-helpers/assertEvent')(web3)
const { bn, MAX_UINT256, bigExp, ONE } = require('../helpers/numbers')(web3)
const { getEvents, getEventArgument } = require('@aragon/test-helpers/events')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)
const { NOW, ONE_MONTH, TWO_MONTHS } = require('../helpers/time')
const { deployDAI } = require('../helpers/tokens')(artifacts, web3)

contract('Payroll payday', ([owner, employee, anyone]) => {
  let dao, payroll, payrollBase, finance, vault, DAI, ANT, equityTokenManager

  const increaseTime = async seconds => {
    await payroll.mockIncreaseTime(seconds)
  }

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager, equityToken: ANT } = await deployContracts(owner))
    DAI = await deployDAI(owner, finance)
  })

  beforeEach('create payroll', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
  })


  context('when it has already been initialized', function () {
      beforeEach('initialize payroll app using DAI as denomination token', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
      })

      context('when the sender is an employee', () => {
        let employeeId
        const from = employee
        const allocationDAI = 80
        const allocationANT = 20
        const allocationDAIBn = bigExp(allocationDAI, 16)

        function exchangedAmountLocal(amount, tokenAllocation) {
          return amount.mul(bn(tokenAllocation)).div(bn(100))
        }

        const assertTransfersRequestedSalary = async (requestedDAI, requestedANT, requestedAmount) => {
          const previousDAI = await DAI.balanceOf(employee)
          const previousANT = await ANT.balanceOf(employee)

          await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

          const currentDAI = await DAI.balanceOf(employee)
          const expectedDAI = previousDAI.add(requestedDAI);

          assert.equal(currentDAI.toString(), expectedDAI.toString(), 'current DAI balance does not match')

          const currentANT = await ANT.balanceOf(employee)
          const expectedANT = previousANT.add(requestedANT)

          assert.equal(currentANT.toString(), expectedANT.toString(), 'current ANT balance does not match')
        }

        context('when the employee has a reasonable salary', () => {
          const salary = bigExp(1, 18) // using 1 USD per second to simplify incomes in tests

          beforeEach('add employee', async () => {
            const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss')
            employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId')
          })

          context('when the employee has already set a token allocation', () => {
            const assertTransferredAmounts = (requestedAmount, expectedRequestedAmount = requestedAmount) => {

              const requestedDAI = exchangedAmountLocal(expectedRequestedAmount, allocationDAI) // 80%
              const requestedANT = expectedRequestedAmount.sub(requestedDAI) // 20%

              it('transfers the requested salary amount', async () => {
                await assertTransfersRequestedSalary(requestedDAI, requestedANT, requestedAmount)
              })

              it('emits correct event', async () => {
                const receipt = await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                assertAmountOfEvents(receipt, 'Payday', 1)
                const events = getEvents(receipt, 'Payday')

                const eventDAI = events.find(e => e.args.token === DAI.address).args
                assert.equal(eventDAI.employeeId.toString(), employeeId.toString(), 'employee id does not match')
                assert.equal(eventDAI.accountAddress, employee, 'employee address does not match')
                assert.equal(eventDAI.token, DAI.address, 'DAI address does not match')
                assert.equal(eventDAI.denominationAllocation.toString(), allocationDAIBn.toString(), 'DAI allocation does not match')
                assert.equal(eventDAI.denominationAmount.toString(), requestedDAI.toString(), 'DAI payment amount does not match')
                assert.equal(eventDAI.equityAmount.toString(), requestedANT.toString(), 'ANT payment amount does not match')
                assert.equal(eventDAI.metaData, "", 'MetaData does not match')
              })

              it('can be called multiple times between periods of time', async () => {
                // terminate employee in the future to ensure we can request payroll multiple times
                await payroll.terminateEmployee(employeeId, NOW + TWO_MONTHS + TWO_MONTHS, { from: owner })

                const previousDAI = await DAI.balanceOf(employee)
                const previousANT = await ANT.balanceOf(employee)

                await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                const newOwedAmount = salary.mul(bn(ONE_MONTH))
                const newDAIAmount = exchangedAmountLocal(newOwedAmount, allocationDAI)
                const newANTAmount = exchangedAmountLocal(newOwedAmount, allocationANT)

                await increaseTime(ONE_MONTH)
                await payroll.payday(allocationDAIBn, newOwedAmount, "", { from })

                const currentDAI = await DAI.balanceOf(employee)
                const expectedDAI = previousDAI.add(requestedDAI).add(newDAIAmount)
                assert.equal(currentDAI.toString(), expectedDAI.toString(), 'current DAI balance does not match')

                const currentANT = await ANT.balanceOf(employee)
                const expectedANT = previousANT.add(requestedANT).add(newANTAmount)
                assert.equal(currentANT.toString(), expectedANT.toString(), 'current ANT balance does not match')
              })
            }

            const assertEmployeeIsUpdatedCorrectly = (requestedAmount, expectedRequestedAmount) => {
              it('updates the employee accounting', async () => {
                const timeAtPayday = await payroll.getTimestampPublic()
                await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                const { accruedSalary, lastPayroll: lastPayrollDate } = (await payroll.getEmployee(employeeId))
                assert.equal(accruedSalary.toString(), 0, 'accrued salary does not match')
                assert.equal(lastPayrollDate.toString(), timeAtPayday, 'last payroll date does not match')
              })

              it('does not remove the employee', async () => {
                await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                const { accountAddress, denominationSalary: employeeSalary } = await payroll.getEmployee(employeeId)
                assert.equal(accountAddress, employee, 'employee address does not match')
                assert.equal(employeeSalary.toString(), salary.toString(), 'employee salary does not match')
              })
            }

            const itHandlesPayrollProperly = (requestedAmount, totalOwedAmount) => {
              const expectedRequestedAmount = requestedAmount.lt(bn(0)) ? totalOwedAmount : requestedAmount

              context('when the employee is not terminated', () => {
                assertTransferredAmounts(requestedAmount, expectedRequestedAmount)
                assertEmployeeIsUpdatedCorrectly(requestedAmount, expectedRequestedAmount)
              })

              context('when the employee is terminated', () => {
                  beforeEach('terminate employee', async () => {
                    await payroll.terminateEmployee(employeeId, await payroll.getTimestampPublic(), { from: owner })
                  })

                  it('removes the employee', async () => {
                    assertTransferredAmounts(requestedAmount, expectedRequestedAmount)
                    await payroll.payday(allocationDAIBn, requestedAmount, "", { from })
                    await assertRevert(payroll.getEmployee(employeeId), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')
                  })
                })
            }

            context('when the employee does not have accrued salary', () => {
              context('when the employee has some pending salary', () => {
                const currentOwedSalary = salary.mul(bn(ONE_MONTH))

                beforeEach('accumulate some pending salary', async () => {
                  await increaseTime(ONE_MONTH)
                })

                context('when the requested amount is negative', () => {
                  const requestedAmount = bn(-1)

                  itHandlesPayrollProperly(requestedAmount, currentOwedSalary)
                })

                context('when the requested amount is large negative', () => {
                  const requestedAmount = bn(-99999)

                  itHandlesPayrollProperly(requestedAmount, currentOwedSalary)
                })

                context('when the requested amount is 0', () => {
                  const requestedAmount = bn(0)

                  itHandlesPayrollProperly(requestedAmount, currentOwedSalary)
                })

                context('when the requested amount is lower than the total owed salary', () => {
                  context('when the requested amount represents less than a second of the earnings', () => {
                    const requestedAmount = salary.div(bn(2))

                    itHandlesPayrollProperly(requestedAmount, currentOwedSalary)
                  })

                  context('when the requested amount represents more than a second of the earnings', () => {
                    const requestedAmount = currentOwedSalary.div(bn(2))

                    itHandlesPayrollProperly(requestedAmount, currentOwedSalary)
                  })
                })

                context('when the requested amount is equal to the total owed salary', () => {
                  itHandlesPayrollProperly(currentOwedSalary, currentOwedSalary)
                })

                context('when the requested amount is greater than the total owed salary', () => {
                  const requestedAmount = currentOwedSalary.add(bn(1))

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from }), 'PAYROLL_INVALID_REQUESTED_AMT')
                  })
                })

                context('when the equityMultiplier is not equal to one', () => {

                  it('transfers the requested salary amount when the equityMultiplier is two', async () => {
                    const requestedDAI = exchangedAmountLocal(currentOwedSalary, allocationDAI) // 80%
                    const requestedANT = (currentOwedSalary.sub(requestedDAI)).mul(bn(2)) // 20% * 2

                    await payroll.setEquitySettings(bigExp(2, 18), 0, 0, false)
                    await assertTransfersRequestedSalary(requestedDAI, requestedANT, currentOwedSalary)
                  })

                  it('transfers the requested salary amount when the equityMultiplier is a half', async () => {
                    const requestedDAI = exchangedAmountLocal(currentOwedSalary, allocationDAI) // 80%
                    const requestedANT = (currentOwedSalary.sub(requestedDAI)).div(bn(2)) // 20% * 0.5

                    await payroll.setEquitySettings(bigExp(50, 16), 0, 0, false)
                    await assertTransfersRequestedSalary(requestedDAI, requestedANT, currentOwedSalary)
                  })

                  it('transfers the requested salary amount when the equityMultiplier is zero', async () => {
                    const requestedDAI = exchangedAmountLocal(currentOwedSalary, allocationDAI) // 80%
                    const requestedANT = bn(0) // 20% * 0

                    await payroll.setEquitySettings(bn(0), 0, 0, false)
                    await assertTransfersRequestedSalary(requestedDAI, requestedANT, currentOwedSalary)
                  })
                })

                context('when vesting is enabled', () => {
                  const assertTransferredAmountWithVesting = async (vestingLength, expectedVestingCliff, expectedVestingRevokable) => {
                    const requestedDAI = exchangedAmountLocal(currentOwedSalary, allocationDAI) // 80%
                    const requestedANT = (currentOwedSalary.sub(requestedDAI)) // 20% * 2

                    await payroll.setEquitySettings(ONE, vestingLength, expectedVestingCliff, expectedVestingRevokable);

                    const previousVestings = await equityTokenManager.vestingsLengths(employee)
                    const timeAtPayday = await payroll.getTimestampPublic()

                    await assertTransfersRequestedSalary(requestedDAI, requestedANT, currentOwedSalary)

                    const accountVestings = await equityTokenManager.vestingsLengths(employee)
                    const expectedVestings = previousVestings.add(bn(1))

                    const {
                      start: vestingStart,
                      cliff: vestingCliff,
                      vesting: vestingEnd,
                      revokable: vestingRevokable
                    } = await equityTokenManager.getVesting(employee, previousVestings);

                    assert.equal(accountVestings.toString(), expectedVestings.toString(), 'current vestings do not match')
                    assert.equal(vestingStart.toString(), timeAtPayday.toString(), 'vesting start time is incorrect')
                    assert.equal(vestingCliff.toString(), timeAtPayday.toNumber() + expectedVestingCliff, 'vesting cliff time is incorrect')
                    assert.equal(vestingEnd.toString(), timeAtPayday.toNumber() + vestingLength, 'vesting end time is incorrect')
                    assert.equal(vestingRevokable, expectedVestingRevokable, 'vesting revokable is incorrect')
                  }

                  it('creates correct vesting for average case', async () => {
                    await assertTransferredAmountWithVesting(100, 50, true)
                  })

                  it('creates correct short vesting', async () => {
                    await assertTransferredAmountWithVesting(1, 0, false)
                  })

                  it('creates correct long vesting', async () => {
                    await assertTransferredAmountWithVesting(1000000, 999999, true)
                  })
                })
              })

              context('when the employee does not have pending salary', () => {
                context('when the requested amount is greater than zero', () => {
                  const requestedAmount = bigExp(100, 18)

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from }), 'PAYROLL_NO_SALARY')
                  })
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from }), 'PAYROLL_NO_SALARY')
                  })
                })

                context('when the requested amount is negative', () => {
                  const requestedAmount = bn(-1)

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from }), 'PAYROLL_NO_SALARY')
                  })
                })
              })
            })

            context('when the employee has some accrued salary', () => {
              const previousSalary = salary.mul(bn(2))
              const previousOwedSalary = previousSalary.mul(bn(ONE_MONTH))

              beforeEach('accrue some salary', async () => {
                await payroll.setEmployeeSalary(employeeId, previousSalary, { from: owner })
                await increaseTime(ONE_MONTH)
                await payroll.setEmployeeSalary(employeeId, salary, { from: owner })
              })

              const itHandlesRemainingAccruedSalaryCorrectly = (requestedAmount) => {
                it('handles remaining accrued salary correctly', async () => {
                  await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                  const { accruedSalary } = (await payroll.getEmployee(employeeId))
                  assert.equal(accruedSalary.toString(), 0, 'accrued salary does not match')
                })
              }

              context('when the employee has some pending salary', () => {
                const currentOwedSalary = salary.mul(bn(ONE_MONTH))
                const totalOwedSalary = previousOwedSalary.add(currentOwedSalary)

                beforeEach('accumulate some pending salary', async () => {
                  await increaseTime(ONE_MONTH)
                })

                context('when the requested amount is negative', () => {
                  const requestedAmount = bn(-1)

                  itHandlesPayrollProperly(requestedAmount, totalOwedSalary)
                  itHandlesRemainingAccruedSalaryCorrectly(requestedAmount, requestedAmount)
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itHandlesPayrollProperly(requestedAmount, totalOwedSalary)
                  itHandlesRemainingAccruedSalaryCorrectly(requestedAmount, requestedAmount)
                })

                context('when the requested amount is lower than the previous owed salary', () => {
                  const remainingAmount = bn(10)
                  const requestedAmount = previousOwedSalary.sub(remainingAmount)

                  itHandlesPayrollProperly(requestedAmount, totalOwedSalary)
                  itHandlesRemainingAccruedSalaryCorrectly(requestedAmount)
                })

                context('when the requested amount is greater than the previous owed salary but less than one second of additional salary', () => {
                  const remainingAmount = bn(1)
                  const requestedAmount = previousOwedSalary.add(salary).sub(remainingAmount)

                  itHandlesPayrollProperly(requestedAmount, totalOwedSalary)

                  // We're requesting all of the accrued salary and just under one second of salary,
                  // so we should get the remaining bit left over
                  itHandlesRemainingAccruedSalaryCorrectly(requestedAmount)
                })

                context('when the requested amount is greater than the previous owed salary but greater than one second of additional salary', () => {
                  const extraAmount = bn(1)
                  const requestedAmount = previousOwedSalary.add(salary).add(extraAmount)

                  itHandlesPayrollProperly(requestedAmount, totalOwedSalary)

                  // We move the salary up a second, so we should get one full second of salary
                  // minus the extra amount left over
                  itHandlesRemainingAccruedSalaryCorrectly(requestedAmount)
                })

                context('when the requested amount is equal to the total owed salary', () => {
                  const requestedAmount = totalOwedSalary

                  itHandlesPayrollProperly(requestedAmount, totalOwedSalary)
                })

                context('when the requested amount is greater than the total owed salary', () => {
                  const requestedAmount = totalOwedSalary.add(bn(1))

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from }), 'PAYROLL_INVALID_REQUESTED_AMT')
                  })
                })
              })

              context('when the employee does not have pending salary', () => {
                context('when the requested amount is negative', () => {
                  const requestedAmount = bn(-1)

                  itHandlesPayrollProperly(requestedAmount, previousOwedSalary)
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itHandlesPayrollProperly(requestedAmount, previousOwedSalary)
                })

                context('when the requested amount is lower than the previous owed salary', () => {
                  const requestedAmount = previousOwedSalary.div(bn(2))

                  itHandlesPayrollProperly(requestedAmount, previousOwedSalary)
                })

                context('when the requested amount is equal to the previous owed salary', () => {
                  const requestedAmount = previousOwedSalary

                  itHandlesPayrollProperly(requestedAmount, previousOwedSalary)
                })

                context('when the requested amount is greater than the previous owed salary', () => {
                  const requestedAmount = previousOwedSalary.add(bn(1))

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from }), 'PAYROLL_INVALID_REQUESTED_AMT')
                  })
                })
              })
            })
          })
        })

        context('when the employee does not have a reasonable salary', () => {

          const itReverts = (requestedAmount, reason) => {
            it('reverts', async () => {
              await assertRevert(payroll.payday(bigExp(80, 16), requestedAmount, "", { from }), reason)
            })
          }

          const itRevertsToWithdrawPartialPayroll = (requestedAmount, noSalaryReason) => {
            context('when the employee is not terminated', () => {
              itReverts(requestedAmount, noSalaryReason)
            })

            context('when the employee is terminated', () => {
              beforeEach('terminate employee', async () => {
                await payroll.terminateEmployee(employeeId, await payroll.getTimestampPublic(), { from: owner })
              })

              itReverts(requestedAmount, noSalaryReason)
            })
          }

          context('when the employee has a zero salary', () => {
            const salary = bn(0)

            beforeEach('add employee', async () => {
              const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss')
              employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId')
            })

            context('when the employee has some pending salary', () => {
              beforeEach('accumulate some pending salary', async () => {
                await increaseTime(ONE_MONTH)
              })

              context('when the requested amount is zero', () => {
                const requestedAmount = bn(0)

                itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_NO_SALARY')
              })

              context('when the requested amount is greater than zero', () => {
                const requestedAmount = bigExp(10000, 18)

                itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_NO_SALARY')
              })

              context('when the requested amount is negative', () => {
                const requestedAmount = bn(-1)

                itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_NO_SALARY')
              })
            })

            context('when the employee does not have pending salary', () => {
              context('when the requested amount is greater than zero', () => {
                const requestedAmount = bigExp(1000, 18)

                itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_NO_SALARY')
              })

              context('when the requested amount is negative', () => {
                const requestedAmount = bn(-1)

                itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_NO_SALARY')
              })
            })
          })

          context('when the employee has a huge salary', () => {
            const salary = MAX_UINT256

            beforeEach('add employee', async () => {
              const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss')
              employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId')
            })

            context('when the employee has some pending salary', () => {
              const owedSalary = MAX_UINT256

              const itHandlesPayrollNeverthelessTheAccruedSalary = () => {
                context('when the requested amount is max', () => {
                  const requestedAmount = bn(-1)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'MATH_MUL_OVERFLOW')
                })

                context('when the requested amount is lower than the total owed salary', () => {
                  const requestedAmount = bigExp(1000, 18)

                  const assertTransferredAmounts = (requestedAmount) => {
                    const requestedDAI = exchangedAmountLocal(requestedAmount, allocationDAI) // 80%
                    const requestedANT = requestedAmount.sub(requestedDAI) // 20%

                    it('transfers the requested salary amount', async () => {
                      await assertTransfersRequestedSalary(requestedDAI, requestedANT, requestedAmount)
                    })

                    it('emits correct event', async () => {
                      const receipt = await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                      assertAmountOfEvents(receipt, 'Payday', 1)
                      const events = getEvents(receipt, 'Payday')

                      const eventDAI = events.find(e => e.args.token === DAI.address).args
                      assert.equal(eventDAI.employeeId.toString(), employeeId.toString(), 'employee id does not match')
                      assert.equal(eventDAI.accountAddress, employee, 'employee address does not match')
                      assert.equal(eventDAI.token, DAI.address, 'DAI address does not match')
                      assert.equal(eventDAI.denominationAllocation.toString(), allocationDAIBn.toString(), 'DAI allocation does not match')
                      assert.equal(eventDAI.denominationAmount.toString(), requestedDAI.toString(), 'DAI payment amount does not match')
                      assert.equal(eventDAI.equityAmount.toString(), requestedANT.toString(), 'ANT payment amount does not match')
                      assert.equal(eventDAI.metaData, "", 'MetaData does not match')
                    })

                    it('can be called multiple times between periods of time', async () => {
                      // terminate employee in the future to ensure we can request payroll multiple times
                      await payroll.terminateEmployee(employeeId, NOW + TWO_MONTHS + TWO_MONTHS, { from: owner })

                      const previousDAI = await DAI.balanceOf(employee)
                      const previousANT = await ANT.balanceOf(employee)

                      await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                      await increaseTime(ONE_MONTH)
                      await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                      const currentDAI = await DAI.balanceOf(employee)
                      const expectedDAI = previousDAI.add(requestedDAI.mul(bn(2)))
                      assert.equal(currentDAI.toString(), expectedDAI.toString(), 'current DAI balance does not match')

                      const currentANT = await ANT.balanceOf(employee)
                      const expectedANT = previousANT.add(requestedANT.mul(bn(2)))
                      assert.equal(currentANT.toString(), expectedANT.toString(), 'current ANT balance does not match')
                    })
                  }

                  const assertEmployeeIsUpdated = (requestedAmount) => {

                    it('updates the employee accounting', async () => {
                      const timeAtPayday = await payroll.getTimestampPublic()
                      await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                      const { accruedSalary, lastPayroll: lastPayrollDate } = (await payroll.getEmployee(employeeId))
                      assert.equal(accruedSalary.toString(), 0, 'accrued salary does not match')
                      assert.equal(lastPayrollDate.toString(), timeAtPayday.toString(), 'last payroll date does not match')
                    })

                    it('does not remove the employee', async () => {
                      await payroll.payday(allocationDAIBn, requestedAmount, "", { from })

                      const { accountAddress, denominationSalary: employeeSalary } = await payroll.getEmployee(employeeId)
                      assert.equal(accountAddress, employee, 'employee address does not match')
                      assert.equal(employeeSalary.toString(), salary.toString())
                    })
                  }

                  const itHandlesPayrollProperly = requestedAmount => {
                      assertTransferredAmounts(requestedAmount)
                      assertEmployeeIsUpdated(requestedAmount)
                  }

                  context('when the employee does not have pending reimbursements', () => {
                    context('when the employee is not terminated', () => {
                      itHandlesPayrollProperly(requestedAmount)
                    })

                    context('when the employee is terminated', () => {
                      beforeEach('terminate employee', async () => {
                        await payroll.terminateEmployee(employeeId, await payroll.getTimestampPublic(), { from: owner })
                      })

                      it('removes the employee', async () => {
                        assertTransferredAmounts(requestedAmount)
                        await payroll.payday(allocationDAIBn, requestedAmount, "", { from })
                        await assertRevert(payroll.getEmployee(employeeId), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')
                      })
                    })
                  })
                })

                context('when the requested amount is equal to the total owed salary', () => {
                  itRevertsToWithdrawPartialPayroll(owedSalary, 'MATH_MUL_OVERFLOW')
                })

                context('when the equityMultiplier is two', () => {

                  beforeEach('set multiplier', async () => {
                    await payroll.setEquitySettings(bigExp(2, 18), 0, 0, false)
                  })

                  itReverts(owedSalary, 'MATH_MUL_OVERFLOW')
                })

                context('when vesting is enabled', () => {

                  beforeEach('enable vesting', async () => {
                    await payroll.setEquitySettings(ONE, 100, 50, false);
                  })

                  itReverts(owedSalary, 'MATH_MUL_OVERFLOW')
                })
              }

              context('when the employee does not have accrued salary', () => {
                beforeEach('accumulate some pending salary', async () => {
                  await increaseTime(ONE_MONTH)
                })

                itHandlesPayrollNeverthelessTheAccruedSalary()
              })

              context('when the employee has accrued salary', () => {
                beforeEach('accrue some salary', async () => {
                  // accrue 100 USD of salary
                  const previousSalary = bigExp(1, 18)
                  await payroll.setEmployeeSalary(employeeId, previousSalary, { from: owner })
                  await increaseTime(100)

                  // accumulate 1 month of payroll
                  await payroll.setEmployeeSalary(employeeId, salary, { from: owner })
                  await increaseTime(ONE_MONTH)
                })

                itHandlesPayrollNeverthelessTheAccruedSalary()
              })
            })

            context('when the employee does not have pending salary', () => {
                context('when the requested amount is greater than zero', () => {
                  const requestedAmount = bigExp(100, 18)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_NO_SALARY')
                })

                context('when the requested amount is negative', () => {
                  const requestedAmount = bn(-1)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_NO_SALARY')
                })
              })

          })
        })
      })

      context('when the sender is not an employee', () => {
        const from = anyone
        const allocationDAIBn = bigExp(80, 16)

        context('when the requested amount is greater than zero', () => {
          const requestedAmount = bigExp(1000, 18)

          it('reverts', async () => {
            await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from }), 'PAYROLL_SENDER_DOES_NOT_MATCH')
          })
        })

        context('when the requested amount is zero', () => {
          const requestedAmount = bn(0)

          it('reverts', async () => {
            await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from }), 'PAYROLL_SENDER_DOES_NOT_MATCH')
          })
        })

        context('when the requested amount is negative', () => {
          const requestedAmount = bn(-1)

          it('reverts', async () => {
            await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from }), 'PAYROLL_SENDER_DOES_NOT_MATCH')
          })
        })
      })
    })

  context('when it has not been initialized yet', () => {
    const requestedAmount = bn(-1)
    const allocationDAIBn = bigExp(80, 16)

    it('reverts', async () => {
      await assertRevert(payroll.payday(allocationDAIBn, requestedAmount, "", { from: employee }), 'PAYROLL_SENDER_DOES_NOT_MATCH')
    })
  })
})
