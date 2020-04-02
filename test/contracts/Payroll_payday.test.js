const PAYMENT_TYPES = require('../helpers/payment_types')
const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { assertAmountOfEvents } = require('@aragon/test-helpers/assertEvent')(web3)
const { bn, MAX_UINT256, bigExp, ONE } = require('../helpers/numbers')(web3)
const { getEvents, getEventArgument } = require('@aragon/test-helpers/events')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)
const { NOW, ONE_MONTH, TWO_MONTHS } = require('../helpers/time')
const { USD, DAI_RATE, ANT_RATE, inverseRate, deployDAI, deployANT, exchangedAmount } = require('../helpers/tokens')(artifacts, web3)

contract('Payroll payday', ([owner, employee, anyone]) => {
  let dao, payroll, payrollBase, finance, vault, DAI, ANT, equityTokenManager

  const increaseTime = async seconds => {
    await payroll.mockIncreaseTime(seconds)
  }

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager, equityToken: ANT } = await deployContracts(owner))
    // ANT = await deployANT(owner, finance) // TODO: Replace with equityToken
    DAI = await deployDAI(owner, finance)
  })

  beforeEach('create payroll', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
  })


  context('when it has already been initialized', function () {
      beforeEach('initialize payroll app using DAI as denomination token', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, 1, 0, 0, false, { from: owner })
      })

      context('when the sender is an employee', () => {
        let employeeId
        const from = employee

        context('when the employee has a reasonable salary', () => {
          const salary = bigExp(1, 18) // using 1 USD per second to simplify incomes in tests

          beforeEach('add employee', async () => {
            const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss')
            employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId')
          })

          context('when the employee has already set some token allocations', () => {
            const allocationDAI = 80
            const allocationANT = 20

            beforeEach('set tokens allocation 80% DAI - 20% Equity', async () => {
              await payroll.determineAllocation(bigExp(allocationDAI, 16), { from })
            })

            function exchangedAmountLocal(amount, tokenAllocation) {
              return amount.mul(tokenAllocation).div(bn(100)).trunc()
            }

            function exchangedAmountOld(amount, rate, tokenAllocation) {
              // Invert the rate, as we always set the denomination token as the price feed's quote token
              const inversedRate = inverseRate(rate)
              // Mimic EVM calculation and truncation for token conversion
              return amount.mul(inversedRate).mul(tokenAllocation).div(ONE.mul(100)).trunc()
            }

            const assertTransferredAmounts = (requestedAmount, expectedRequestedAmount = requestedAmount, minRates = []) => {

              // console.log("requestedAmount:", requestedAmount.toString())
              // console.log("expectedRequestedAmount:", expectedRequestedAmount)

              const requestedDAI = exchangedAmountLocal(expectedRequestedAmount, allocationDAI) // 80%
              const requestedANT = expectedRequestedAmount.sub(requestedDAI) // 20%

              // const requestedDAIOl = exchangedAmount(expectedRequestedAmount, DAI_RATE, allocationDAI)
              // const requestedANTOl = exchangedAmount(expectedRequestedAmount, ANT_RATE, allocationANT)

              // console.log("requestDAI", requestedDAI)
              // console.log("requestedANT", requestedANT)
              // console.log("requestedDAIOl", requestedDAIOl)
              // console.log("requestedANTOl", requestedANTOl)

              it('transfers the requested salary amount', async () => {
                const previousDAI = await DAI.balanceOf(employee)
                const previousANT = await ANT.balanceOf(employee)

                await payroll.payday(requestedAmount, { from })

                const currentDAI = await DAI.balanceOf(employee)
                const expectedDAI = previousDAI.plus(requestedDAI);

                // console.log("requestDAI:", requestedDAI)
                // console.log("previousDAI:", previousDAI)
                // console.log("currentDAI:", currentDAI)
                // console.log("expectedDAI:", expectedDAI)

                assert.equal(currentDAI.toString(), expectedDAI.toString(), 'current DAI balance does not match')

                const currentANT = await ANT.balanceOf(employee)
                const expectedANT = previousANT.plus(requestedANT)

                // console.log("requestedANT:", requestedANT)
                // console.log("previousANT:", previousANT)
                // console.log("currentANT:", currentANT)
                // console.log("expectedANT:", expectedANT)

                assert.equal(currentANT.toString(), expectedANT.toString(), 'current ANT balance does not match')
              })

              it('emits correct event', async () => {
                const receipt = await payroll.payday(requestedAmount, { from })

                assertAmountOfEvents(receipt, 'SendPayment', 1)
                const events = getEvents(receipt, 'SendPayment')

                const eventDAI = events.find(e => e.args.token === DAI.address).args
                assert.equal(eventDAI.employeeId.toString(), employeeId.toString(), 'employee id does not match')
                assert.equal(eventDAI.accountAddress, employee, 'employee address does not match')
                assert.equal(eventDAI.token, DAI.address, 'DAI address does not match')
                assert.equal(eventDAI.denominationAmount.toString(), requestedDAI.toString(), 'DAI payment amount does not match')
                assert.equal(eventDAI.equityAmount.toString(), requestedANT.toString(), 'ANT payment amount does not match')
              })

              it('can be called multiple times between periods of time', async () => {
                // terminate employee in the future to ensure we can request payroll multiple times
                await payroll.terminateEmployee(employeeId, NOW + TWO_MONTHS + TWO_MONTHS, { from: owner })

                const previousDAI = await DAI.balanceOf(employee)
                const previousANT = await ANT.balanceOf(employee)

                await payroll.payday(requestedAmount, { from })

                const newOwedAmount = salary.mul(ONE_MONTH)
                const newDAIAmount = exchangedAmountLocal(newOwedAmount, allocationDAI)
                const newANTAmount = exchangedAmountLocal(newOwedAmount, allocationANT)

                await increaseTime(ONE_MONTH)
                await payroll.payday(newOwedAmount, { from })

                const currentDAI = await DAI.balanceOf(employee)
                const expectedDAI = previousDAI.plus(requestedDAI).plus(newDAIAmount)
                assert.equal(currentDAI.toString(), expectedDAI.toString(), 'current DAI balance does not match')

                const currentANT = await ANT.balanceOf(employee)
                const expectedANT = previousANT.plus(requestedANT).plus(newANTAmount)
                assert.equal(currentANT.toString(), expectedANT.toString(), 'current ANT balance does not match')
              })
            }

            const assertEmployeeIsUpdatedCorrectly = (requestedAmount, expectedRequestedAmount, minRates = []) => {
              it('updates the employee accounting', async () => {
                let expectedLastPayrollDate, expectedAccruedSalary

                const [, , previousAccruedSalary, previousPayrollDate, , ] = (await payroll.getEmployee(employeeId))

                if (expectedRequestedAmount.gte(previousAccruedSalary)) {
                  const currentSalaryPaid = expectedRequestedAmount.minus(previousAccruedSalary)
                  const extraSalary = currentSalaryPaid.mod(salary)
                  expectedAccruedSalary = extraSalary.gt(0) ? salary.minus(extraSalary) : 0
                  expectedLastPayrollDate = previousPayrollDate.plus(currentSalaryPaid.div(salary).ceil())
                } else {
                  expectedAccruedSalary = previousAccruedSalary.minus(expectedRequestedAmount).toString()
                  expectedLastPayrollDate = previousPayrollDate
                }

                await payroll.payday(requestedAmount, { from })

                const [, , accruedSalary, lastPayrollDate, , ] = (await payroll.getEmployee(employeeId))
                assert.equal(accruedSalary.toString(), expectedAccruedSalary.toString(), 'accrued salary does not match')
                assert.equal(lastPayrollDate.toString(), expectedLastPayrollDate.toString(), 'last payroll date does not match')
              })

              it('does not remove the employee', async () => {
                await payroll.payday(requestedAmount, { from })

                const [address, employeeSalary] = await payroll.getEmployee(employeeId)

                assert.equal(address, employee, 'employee address does not match')
                assert.equal(employeeSalary.toString(), salary.toString(), 'employee salary does not match')
              })
            }

            const itHandlesPayrollProperly = (requestedAmount, expectedRequestedAmount) => {
                assertTransferredAmounts(requestedAmount, expectedRequestedAmount)
                assertEmployeeIsUpdatedCorrectly(requestedAmount, expectedRequestedAmount)
            }

            const itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts = (requestedAmount, totalOwedAmount) => {
              const expectedRequestedAmount = requestedAmount.eq(0) ? totalOwedAmount : requestedAmount

              context('when the employee is not terminated', () => {
                  itHandlesPayrollProperly(requestedAmount, expectedRequestedAmount)
                })

              context('when the employee is terminated', () => {
                  beforeEach('terminate employee', async () => {
                    await payroll.terminateEmployee(employeeId, await payroll.getTimestampPublic(), { from: owner })
                  })

                  if (requestedAmount.eq(0) || requestedAmount.eq(totalOwedAmount)) {
                      it('removes the employee', async () => {
                        assertTransferredAmounts(requestedAmount, expectedRequestedAmount)
                        await payroll.payday(requestedAmount, { from })
                        await assertRevert(payroll.getEmployee(employeeId))
                        // await assertRevert(payroll.getEmployee(employeeId), 'PAYROLL_EMPLOYEE_DOESNT_EXIST')
                      })
                  }
                  else itHandlesPayrollProperly(requestedAmount, expectedRequestedAmount)
                })
            }

            context.only('when the employee does not have accrued salary', () => {
              context('when the employee has some pending salary', () => {
                const currentOwedSalary = salary.mul(ONE_MONTH)

                beforeEach('accumulate some pending salary', async () => {
                  await increaseTime(ONE_MONTH)
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, currentOwedSalary)
                })

                context('when the requested amount is lower than the total owed salary', () => {
                  context('when the requested amount represents less than a second of the earnings', () => {
                    const requestedAmount = salary.div(2).floor()

                    itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, currentOwedSalary)
                  })

                  context('when the requested amount represents more than a second of the earnings', () => {
                    const requestedAmount = currentOwedSalary.div(2).ceil()

                    itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, currentOwedSalary)
                  })
                })

                context('when the requested amount is equal to the total owed salary', () => {
                  const requestedAmount = currentOwedSalary

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, currentOwedSalary)
                })

                context('when the requested amount is greater than the total owed salary', () => {
                  const requestedAmount = currentOwedSalary.plus(1)

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(requestedAmount, { from }), )
                    // await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_INVALID_REQUESTED_AMT')
                  })
                })
              })

              context('when the employee does not have pending salary', () => {
                context('when the requested amount is greater than zero', () => {
                  const requestedAmount = bigExp(100, 18)

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(requestedAmount, { from }), )
                    // await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_NOTHING_PAID')
                  })
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(requestedAmount, { from }), )
                    // await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_NOTHING_PAID')
                  })
                })
              })
            })

            context.only('when the employee has some accrued salary', () => {
              const previousSalary = salary.mul(2)
              const previousOwedSalary = previousSalary.mul(ONE_MONTH)

              beforeEach('accrue some salary', async () => {
                await payroll.setEmployeeSalary(employeeId, previousSalary, { from: owner })
                await increaseTime(ONE_MONTH)
                await payroll.setEmployeeSalary(employeeId, salary, { from: owner })
              })

              const itHandlesRemainingAccruedSalaryCorrectly = (requestedAmount, expectedAccruedSalary) => {
                it('handles remaining accrued salary correctly', async () => {
                  await payroll.payday(requestedAmount, { from })

                  const [accruedSalary] = (await payroll.getEmployee(employeeId)).slice(2)
                  assert.equal(accruedSalary.toString(), expectedAccruedSalary.toString(), 'accrued salary does not match')
                })
              }

              context('when the employee has some pending salary', () => {
                const currentOwedSalary = salary.mul(ONE_MONTH)
                const totalOwedSalary = previousOwedSalary.plus(currentOwedSalary)

                beforeEach('accumulate some pending salary and renew token rates', async () => {
                  await increaseTime(ONE_MONTH)
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, totalOwedSalary)
                  itHandlesRemainingAccruedSalaryCorrectly(requestedAmount, bn(0))
                })

                context('when the requested amount is lower than the previous owed salary', () => {
                  const remainingAmount = bn(10)
                  const requestedAmount = previousOwedSalary.minus(remainingAmount)

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, totalOwedSalary)
                  itHandlesRemainingAccruedSalaryCorrectly(requestedAmount, remainingAmount)
                })

                context('when the requested amount is greater than the previous owed salary but less than one second of additional salary', () => {
                  const remainingAmount = bn(1)
                  const requestedAmount = previousOwedSalary.plus(salary).minus(remainingAmount)

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, totalOwedSalary)

                  // We're requesting all of the accrued salary and just under one second of salary,
                  // so we should get the remaining bit left over
                  itHandlesRemainingAccruedSalaryCorrectly(requestedAmount, remainingAmount)
                })

                context('when the requested amount is greater than the previous owed salary but greater than one second of additional salary', () => {
                  const extraAmount = bn(1)
                  const requestedAmount = previousOwedSalary.plus(salary).plus(extraAmount)

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, totalOwedSalary)

                  // We move the salary up a second, so we should get one full second of salary
                  // minus the extra amount left over
                  const remainingAmount = salary.minus(extraAmount)
                  itHandlesRemainingAccruedSalaryCorrectly(requestedAmount, remainingAmount)
                })

                context('when the requested amount is equal to the total owed salary', () => {
                  const requestedAmount = totalOwedSalary

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, totalOwedSalary)
                })

                context('when the requested amount is greater than the total owed salary', () => {
                  const requestedAmount = totalOwedSalary.plus(1)

                  it('reverts', async () => {
                    // await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_INVALID_REQUESTED_AMT')
                    await assertRevert(payroll.payday(requestedAmount, { from }))
                  })
                })
              })

              context('when the employee does not have pending salary', () => {
                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, previousOwedSalary)
                })

                context('when the requested amount is lower than the previous owed salary', () => {
                  const requestedAmount = previousOwedSalary.div(2).floor()

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, previousOwedSalary)
                })

                context('when the requested amount is equal to the previous owed salary', () => {
                  const requestedAmount = previousOwedSalary

                  itHandlesPayrollProperlyNeverthelessExtrasOwedAmounts(requestedAmount, previousOwedSalary)
                })

                context('when the requested amount is greater than the previous owed salary', () => {
                  const requestedAmount = previousOwedSalary.plus(1)

                  it('reverts', async () => {
                    await assertRevert(payroll.payday(requestedAmount, { from }))
                    // await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_INVALID_REQUESTED_AMT')
                  })
                })
              })
            })
          })

          context('when the employee did not set any token allocations yet', () => {
            context('when the employee has some pending salary', () => {
              const owedSalary = salary.mul(ONE_MONTH)

              beforeEach('accumulate some pending salary', async () => {
                await increaseTime(ONE_MONTH)
              })

              context('when the requested amount is lower than the total owed salary', () => {
                const requestedAmount = owedSalary.div(2).floor()

                it('reverts', async () => {
                  await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_DISTRIBUTION_NOT_FULL')
                })
              })

              context('when the requested amount is equal to the total owed salary', () => {
                const requestedAmount = owedSalary

                it('reverts', async () => {
                  await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_DISTRIBUTION_NOT_FULL')
                })
              })
            })

            context('when the employee does not have pending salary', () => {
              context('when the requested amount is greater than zero', () => {
                const requestedAmount = bigExp(100, 18)

                it('reverts', async () => {
                  await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_DISTRIBUTION_NOT_FULL')
                })
              })

              context('when the requested amount is zero', () => {
                const requestedAmount = bn(0)

                it('reverts', async () => {
                  await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_DISTRIBUTION_NOT_FULL')
                })
              })
            })
          })
        })

        context('when the employee does not have a reasonable salary', () => {
          const itReverts = (requestedAmount, reason) => {
            it('reverts', async () => {
              await assertRevert(payroll.payday(requestedAmount, { from }), reason)
            })
          }

          const itRevertsHandlingExpiredRates = (requestedAmount, nonExpiredRatesReason, expiredRatesReason) => {
            context('when exchange rates are not expired', () => {
              itReverts(requestedAmount, nonExpiredRatesReason)
            })

          }

          const itRevertsToWithdrawPartialPayroll = (requestedAmount, nonExpiredRatesReason, expiredRatesReason) => {

            context('when the employee does not have pending reimbursements', () => {
              context('when the employee is not terminated', () => {
                itRevertsHandlingExpiredRates(requestedAmount, nonExpiredRatesReason, expiredRatesReason)
              })

              context('when the employee is terminated', () => {
                beforeEach('terminate employee', async () => {
                  await payroll.terminateEmployee(employeeId, await payroll.getTimestampPublic(), { from: owner })
                })

                itRevertsHandlingExpiredRates(requestedAmount, nonExpiredRatesReason, expiredRatesReason)
              })
            })
          }

          context('when the employee has a zero salary', () => {
            const salary = bn(0)

            beforeEach('add employee', async () => {
              const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss')
              employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId')
            })

            const itRevertsAnyAttemptToWithdrawPartialPayroll = revertReason => {
              context('when the employee has some pending salary', () => {
                beforeEach('accumulate some pending salary', async () => {
                  await increaseTime(ONE_MONTH)
                })

                context('when the requested amount is greater than zero', () => {
                  const requestedAmount = bigExp(10000, 18)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, revertReason, revertReason)
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, revertReason, revertReason)
                })
              })

              context('when the employee does not have pending salary', () => {
                context('when the requested amount is greater than zero', () => {
                  const requestedAmount = bigExp(1000, 18)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, revertReason, revertReason)
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, revertReason, revertReason)
                })
              })
            }

            context('when the employee has already set some token allocations', () => {
              const allocationDAI = 80
              const allocationANT = 20

              beforeEach('set tokens allocation', async () => {
                await payroll.setAllowedToken(ANT.address, true, { from: owner })
                await payroll.setAllowedToken(DAI.address, true, { from: owner })
                await payroll.determineAllocation([DAI.address, ANT.address], [allocationDAI, allocationANT], { from })
              })

              itRevertsAnyAttemptToWithdrawPartialPayroll('PAYROLL_NOTHING_PAID')
            })

            context('when the employee did not set any token allocations yet', () => {
              itRevertsAnyAttemptToWithdrawPartialPayroll('PAYROLL_DISTRIBUTION_NOT_FULL')
            })
          })

          context('when the employee has a huge salary', () => {
            const salary = MAX_UINT256

            beforeEach('add employee', async () => {
              const receipt = await payroll.addEmployee(employee, salary, await payroll.getTimestampPublic(), 'Boss')
              employeeId = getEventArgument(receipt, 'AddEmployee', 'employeeId')
            })

            context('when the employee has already set some token allocations', () => {
              const allocationDAI = 80
              const allocationANT = 20

              beforeEach('set tokens allocation', async () => {
                await payroll.setAllowedToken(ANT.address, true, { from: owner })
                await payroll.setAllowedToken(DAI.address, true, { from: owner })
                await payroll.determineAllocation([DAI.address, ANT.address], [allocationDAI, allocationANT], { from })
              })

              context('when the employee has some pending salary', () => {
                const owedSalary = MAX_UINT256

                const itHandlesPayrollNeverthelessTheAccruedSalary = () => {
                  context('when the requested amount is zero', () => {
                    const requestedAmount = bn(0)

                    itRevertsToWithdrawPartialPayroll(requestedAmount, 'MATH_MUL_OVERFLOW', 'PAYROLL_EXCHANGE_RATE_TOO_LOW')
                  })

                  context('when the requested amount is lower than the total owed salary', () => {
                    const requestedAmount = bigExp(1000, 18)

                    const assertTransferredAmounts = (requestedAmount, minRates = []) => {
                      const requestedDAI = exchangedAmount(requestedAmount, DAI_RATE, allocationDAI)
                      const requestedANT = exchangedAmount(requestedAmount, ANT_RATE, allocationANT)

                      it('transfers the requested salary amount', async () => {
                        const previousDAI = await DAI.balanceOf(employee)
                        const previousANT = await ANT.balanceOf(employee)

                        await payroll.payday(PAYMENT_TYPES.PAYROLL, requestedAmount, minRates, { from })

                        const currentDAI = await DAI.balanceOf(employee)
                        const expectedDAI = previousDAI.plus(requestedDAI)
                        assert.equal(currentDAI.toString(), expectedDAI.toString(), 'current DAI balance does not match')

                        const currentANT = await ANT.balanceOf(employee)
                        const expectedANT = previousANT.plus(requestedANT)
                        assert.equal(currentANT.toString(), expectedANT.toString(), 'current ANT balance does not match')
                      })

                      it('emits one event per allocated token', async () => {
                        const receipt = await payroll.payday(PAYMENT_TYPES.PAYROLL, requestedAmount, minRates, { from })

                        assertAmountOfEvents(receipt, 'SendPayment', 2)
                        const events = getEvents(receipt, 'SendPayment')

                        const eventDAI = events.find(e => e.args.token === DAI.address).args
                        assert.equal(eventDAI.employeeId.toString(), employeeId.toString(), 'employee id does not match')
                        assert.equal(eventDAI.accountAddress, employee, 'employee address does not match')
                        assert.equal(eventDAI.token, DAI.address, 'DAI address does not match')
                        assert.equal(eventDAI.amount.toString(), requestedDAI.toString(), 'payment amount does not match')
                        assert.equal(eventDAI.exchangeRate.toString(), inverseRate(DAI_RATE).toString(), 'payment exchange rate does not match')
                        assert.equal(eventDAI.paymentReference, 'Employee salary', 'payment reference does not match')

                        const eventANT = events.find(e => e.args.token === ANT.address).args
                        assert.equal(eventANT.employeeId.toString(), employeeId.toString(), 'employee id does not match')
                        assert.equal(eventANT.accountAddress, employee, 'employee address does not match')
                        assert.equal(eventANT.token, ANT.address, 'ANT address does not match')
                        assert.equal(eventANT.amount.toString(), requestedANT.toString(), 'payment amount does not match')
                        assert.equal(eventANT.exchangeRate.toString(), inverseRate(ANT_RATE).toString(), 'payment exchange rate does not match')
                        assert.equal(eventANT.paymentReference, 'Employee salary', 'payment reference does not match')
                      })

                      it('can be called multiple times between periods of time', async () => {
                        // terminate employee in the future to ensure we can request payroll multiple times
                        await payroll.terminateEmployee(employeeId, NOW + TWO_MONTHS + TWO_MONTHS, { from: owner })

                        const previousDAI = await DAI.balanceOf(employee)
                        const previousANT = await ANT.balanceOf(employee)

                        await payroll.payday(PAYMENT_TYPES.PAYROLL, requestedAmount, minRates, { from })

                        await increaseTime(ONE_MONTH)
                        await setTokenRates(priceFeed, USD, [DAI, ANT], [DAI_RATE, ANT_RATE])
                        await payroll.payday(PAYMENT_TYPES.PAYROLL, requestedAmount, minRates, { from })

                        const currentDAI = await DAI.balanceOf(employee)
                        const expectedDAI = previousDAI.plus(requestedDAI.mul(2))
                        assert.equal(currentDAI.toString(), expectedDAI.toString(), 'current DAI balance does not match')

                        const currentANT = await ANT.balanceOf(employee)
                        const expectedANT = previousANT.plus(requestedANT.mul(2))
                        assert.equal(currentANT.toString(), expectedANT.toString(), 'current ANT balance does not match')
                      })
                    }

                    const assertEmployeeIsUpdated = (requestedAmount, minRates = []) => {
                      it('updates the employee accounting', async () => {
                        const timeDiff = 1 // should be bn(requestedAmount).div(salary).ceil() but BN cannot represent such a small number, hardcoding it to 1
                        const [previousAccruedSalary, , , previousPayrollDate] = (await payroll.getEmployee(employeeId)).slice(2, 6)

                        const totalAccruedSalary = previousAccruedSalary.plus(owedSalary.sub(requestedAmount))
                        const expectedAccruedSalary = (totalAccruedSalary.gt(MAX_UINT256) ? MAX_UINT256 : totalAccruedSalary).toString()
                        const expectedLastPayrollDate = previousPayrollDate.plus(timeDiff)

                        await payroll.payday(PAYMENT_TYPES.PAYROLL, requestedAmount, minRates, { from })

                        const [accruedSalary, , , lastPayrollDate] = (await payroll.getEmployee(employeeId)).slice(2, 6)
                        assert.equal(accruedSalary.toString(), expectedAccruedSalary.toString(), 'accrued salary does not match')
                        assert.equal(lastPayrollDate.toString(), expectedLastPayrollDate.toString(), 'last payroll date does not match')
                      })

                      it('does not remove the employee', async () => {
                        await payroll.payday(PAYMENT_TYPES.PAYROLL, requestedAmount, minRates, { from })

                        const [address, employeeSalary] = await payroll.getEmployee(employeeId)

                        assert.equal(address, employee, 'employee address does not match')
                        assert.equal(employeeSalary.toString(), salary.toString())
                      })
                    }

                    const itHandlesPayrollProperly = requestedAmount => {
                      context('when exchange rates are not expired', () => {
                        context('when allocated tokens are still allowed', () => {
                          context('when the employee does not provide minimum acceptable rates', () => {
                            const minRates = []

                            assertTransferredAmounts(requestedAmount, minRates)
                            assertEmployeeIsUpdated(requestedAmount, minRates)
                          })

                          context('when the employee provides minimum acceptable rates', () => {
                            context('when the exchange rates match the min acceptable ones', () => {
                              const minRates = [inverseRate(DAI_RATE), inverseRate(ANT_RATE)]

                              assertTransferredAmounts(requestedAmount, minRates)
                              assertEmployeeIsUpdated(requestedAmount, minRates)
                            })

                            context('when the exchange rates does not match the min acceptable ones', () => {
                              const minRates = [inverseRate(DAI_RATE).plus(1), inverseRate(ANT_RATE)]

                              it('reverts', async () => {
                                await assertRevert(payroll.payday(PAYMENT_TYPES.PAYROLL, requestedAmount, minRates, { from }), 'PAYROLL_EXCHANGE_RATE_TOO_LOW')
                              })
                            })
                          })
                        })

                        context('when allocated tokens are not allowed anymore', () => {
                          beforeEach('remove allowed tokens', async () => {
                            await payroll.setAllowedToken(DAI.address, false, { from: owner })
                          })

                          it('reverts', async () => {
                            await assertRevert(payroll.payday(PAYMENT_TYPES.PAYROLL, requestedAmount, [], { from }), 'PAYROLL_NOT_ALLOWED_TOKEN')
                          })
                        })
                      })

                    }

                    context('when the employee does not have pending reimbursements', () => {
                      context('when the employee is not terminated', () => {
                        itHandlesPayrollProperly(requestedAmount)
                      })

                      context('when the employee is terminated', () => {
                        beforeEach('terminate employee', async () => {
                          await payroll.terminateEmployee(employeeId, await payroll.getTimestampPublic(), { from: owner })
                        })

                        itHandlesPayrollProperly(requestedAmount)
                      })
                    })
                  })

                  context('when the requested amount is equal to the total owed salary', () => {
                    const requestedAmount = owedSalary

                    itRevertsToWithdrawPartialPayroll(requestedAmount, 'MATH_MUL_OVERFLOW', 'PAYROLL_EXCHANGE_RATE_TOO_LOW')
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

                    // renew token rates
                    await setTokenRates(priceFeed, USD, [DAI, ANT], [DAI_RATE, ANT_RATE])
                  })

                  itHandlesPayrollNeverthelessTheAccruedSalary()
                })
              })

              context('when the employee does not have pending salary', () => {
                context('when the requested amount is greater than zero', () => {
                  const requestedAmount = bigExp(100, 18)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_NOTHING_PAID', 'PAYROLL_NOTHING_PAID')
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_NOTHING_PAID', 'PAYROLL_NOTHING_PAID')
                })
              })
            })

            context('when the employee did not set any token allocations yet', () => {
              context('when the employee has some pending salary', () => {
                const owedSalary = MAX_UINT256

                beforeEach('accumulate some pending salary', async () => {
                  await increaseTime(ONE_MONTH)
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_DISTRIBUTION_NOT_FULL', 'PAYROLL_DISTRIBUTION_NOT_FULL')
                })

                context('when the requested amount is lower than the total owed salary', () => {
                  const requestedAmount = bigExp(1000, 18)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_DISTRIBUTION_NOT_FULL', 'PAYROLL_DISTRIBUTION_NOT_FULL')
                })

                context('when the requested amount is equal to the total owed salary', () => {
                  const requestedAmount = owedSalary

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_DISTRIBUTION_NOT_FULL', 'PAYROLL_DISTRIBUTION_NOT_FULL')
                })
              })

              context('when the employee does not have pending salary', () => {
                context('when the requested amount is greater than zero', () => {
                  const requestedAmount = bigExp(1000, 18)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_DISTRIBUTION_NOT_FULL', 'PAYROLL_DISTRIBUTION_NOT_FULL')
                })

                context('when the requested amount is zero', () => {
                  const requestedAmount = bn(0)

                  itRevertsToWithdrawPartialPayroll(requestedAmount, 'PAYROLL_DISTRIBUTION_NOT_FULL', 'PAYROLL_DISTRIBUTION_NOT_FULL')
                })
              })
            })
          })
        })
      })

      context('when the sender is not an employee', () => {
        const from = anyone

        context('when the requested amount is greater than zero', () => {
          const requestedAmount = bigExp(1000, 18)

          it('reverts', async () => {
            await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_SENDER_DOES_NOT_MATCH')
          })
        })

        context('when the requested amount is zero', () => {
          const requestedAmount = bn(0)

          it('reverts', async () => {
            await assertRevert(payroll.payday(requestedAmount, { from }), 'PAYROLL_SENDER_DOES_NOT_MATCH')
          })
        })
      })
    })

  context('when it has not been initialized yet', () => {
    const requestedAmount = bn(0)

    it('reverts', async () => {
      await assertRevert(payroll.payday(requestedAmount, { from: employee }), 'PAYROLL_SENDER_DOES_NOT_MATCH')
    })
  })
})
