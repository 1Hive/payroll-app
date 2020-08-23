import app from './app'
import { employee, tokenAllocation } from './marshalling'
import { first, map } from 'rxjs/operators'

export function getEmployeeById(id) {
  return app
    .call('getEmployee', id)
    .pipe(first())
    .pipe(map(data => employee({ id, ...data, role: 'Employee' })))
    .toPromise()
}

export function getEmployeeIdByAddress(accountAddress) {
  return app
    .call('getEmployeeIdByAddress', accountAddress)
    .pipe(first())
    .pipe(map(data => employee({ accountAddress, ...data, role: 'Employee' })))
    .toPromise()
}

export async function getSalaryAllocation(employeeId, tokens) {
  const salaryAllocation = await Promise.all(
    tokens.map(token =>
      app
        .call('getAllocation', employeeId, token.address)
        .pipe(first())
        .pipe(map(allocation => tokenAllocation({ ...token, allocation })))
        .toPromise()
    )
  )

  return salaryAllocation.filter(({ allocation }) => allocation)
}
