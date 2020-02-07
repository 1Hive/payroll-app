# Payroll <img align="right" src="https://github.com/1Hive/website/blob/master/website/static/img/bee.png" height="80px" />

_**Original code:**_ [aragon-apps/apps/payroll](https://github.com/aragon/aragon-apps/tree/master/future-apps/payroll)

The purpose of the Payroll app is to implement a Payroll system ~~in multiple currencies~~.

#### 🐲 Project Stage: development

The Payroll app is still in development. If you are interested in contributing please see our [open issues](https://github.com/1hive/payroll-app).

#### 🚨 Security Review Status: pre-audit

The code in this repository has not been audited.

## How to run Payroll app locally

To use this Aragon application, set it up using a token and a vault using:

```sh
npm install
npm start # It actually starts `npm run start:ipfs:template`
```

If everything is working correctly, your new DAO will be deployed and your browser will open http://localhost:3000/#/YOUR-DAO-ADDRESS.

### Initialization

Initializing a Payroll app requires the following parameters:

- **Finance**: a reference to [Finance](https://github.com/aragon/aragon-apps/tree/master/apps/finance) instance that Payroll app will use to pay salaries. Finance in turn will use [Vault](https://github.com/aragon/aragon-apps/tree/master/apps/vault) to access funds, but going through Finance will have everything properly accounted for.
- **Ether Token**: EtherToken instance used as ether.
- **Denomination Token**: token used to denominate salaries. All exchange rates for other tokens will be paired with it.

### Lifecycle

#### Add allowed token
```
payroll.setAllowedToken(address _allowedToken, true)
```
Add token to the list of accepted ones for salary payment. It needs `MANAGE_ALLOWED_TOKENS_ROLE`.

#### Set exchange rate
```
payroll.setExchangeRate(address token, uint256 denominationExchangeRate)
```
Set the exchange rate for an allowed token against the Payroll denomination token. It needs `ORACLE_ROLE`.

#### Add employee
Three options can be used:
```
payroll.addEmployee(address accountAddress, uint256 initialYearlyDenominationSalary, string role, uint256 startDate)
```
Add employee to the organization. Start date is used as the initial payment day. If it's not provided, the date of the transaction will be used. It needs `ADD_EMPLOYEE_ROLE`.

#### Modify employee salary
```
payroll.setEmployeeSalary(uint128 employeeId, uint256 yearlyDenominationSalary)
```
It needs `ADD_EMPLOYEE_ROLE`.

#### Remove employee
```
payroll.removeEmployee(uint128 employeeId)
```
Remove employee from organization. The owed up to current date salary will be transferred to the employee. It needs `REMOVE_EMPLOYEE_ROLE`.

#### Determine allocation
```
payroll.determineAllocation(address[] tokens, uint8[] distribution)
```
Employees can set the proportion of every allowed token that want to be used for their salary payment. Distribution values are expressed as a ratio to 100.

#### Request payroll
```
payroll.payday()
```
Employees can request payroll whenever they want and the proportional amount of their anual salary since the last request (or since the start date if it's the first one) will be transferred.

#### Change account address
```
payroll.changeAddressByEmployee(address newAddress)
```
Employees can change their own address.

### Limitations

- Allowed tokens can not be removed right now. It wouldn't be trivial, as employees should be notified and they should modifiy their allocation.
- If an employee requests payroll having allocated an allowed token which doesn't have an exchange rate, the transaction will fail. In other words, exchange rates must be set before employees try to use those tokens for their payrolls.
- Exchange rate is not updated automatically. So it could happen that rates are outated when payrolls are requested. An external mechanism for updating rates often should be implemented.
- If there are not enough funds for a given token, `payday` will fail. There's no automatic token conversion yet.

## Contributing

We welcome community contributions!

Please check out our [open Issues](https://github.com/1Hive/conviction-voting-app/issues) to get started.

If you discover something that could potentially impact security, please notify us immediately. The quickest way to reach us is via the #conviction-voting channel in our [team Keybase chat](https://1hive.org/contribute/keybase). Just say hi and that you discovered a potential security vulnerability and we'll DM you to discuss details.
