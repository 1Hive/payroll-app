import { first, map } from 'rxjs/operators'
import app from './app'
import { employee } from './marshalling'

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

