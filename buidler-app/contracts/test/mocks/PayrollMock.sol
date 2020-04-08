pragma solidity 0.4.24;

import "../../Payroll.sol";
import "@aragon/test-helpers/contracts/TimeHelpersMock.sol";


contract PayrollMock is Payroll, TimeHelpersMock {
}
