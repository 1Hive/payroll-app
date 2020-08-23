pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/EtherTokenConstant.sol";
import "@aragon/os/contracts/common/IsContract.sol";
import "@aragon/os/contracts/common/IForwarder.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "@aragon/os/contracts/lib/math/SafeMath64.sol";
import "@aragon/apps-finance/contracts/Finance.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";

contract Payroll is EtherTokenConstant, IForwarder, IsContract, AragonApp {
    using SafeMath for uint256;
    using SafeMath64 for uint64;

    /* Hardcoded constants to save gas
    * bytes32 constant public ADD_EMPLOYEE_ROLE = keccak256("ADD_EMPLOYEE_ROLE");
    * bytes32 constant public TERMINATE_EMPLOYEE_ROLE = keccak256("TERMINATE_EMPLOYEE_ROLE");
    * bytes32 constant public SET_EMPLOYEE_SALARY_ROLE = keccak256("SET_EMPLOYEE_SALARY_ROLE");
    * bytes32 constant public SET_FINANCE_ROLE = keccak256("SET_FINANCE_ROLE");
    * bytes32 constant public SET_DENOMINATION_TOKEN_ROLE = keccak256("SET_DENOMINATION_TOKEN_ROLE");
    * bytes32 constant public SET_TOKEN_MANAGER_ROLE = keccak256("SET_TOKEN_MANAGER_ROLE");
    * bytes32 constant public SET_EQUITY_SETTINGS_ROLE = keccak256("SET_EQUITY_SETTINGS_ROLE");
    */
    bytes32 constant public ADD_EMPLOYEE_ROLE = 0x9ecdc3c63716b45d0756eece5fe1614cae1889ec5a1ce62b3127c1f1f1615d6e;
    bytes32 constant public TERMINATE_EMPLOYEE_ROLE = 0x69c67f914d12b6440e7ddf01961214818d9158fbcb19211e0ff42800fdea9242;
    bytes32 constant public SET_EMPLOYEE_SALARY_ROLE = 0xea9ac65018da2421cf419ee2152371440c08267a193a33ccc1e39545d197e44d;
    bytes32 constant public SET_FINANCE_ROLE = 0x5026a6e66f4418c66689fcfd2b8afe59a2f6bfe3317e3a9ab89a34c742f58481;
    bytes32 constant public SET_DENOMINATION_TOKEN_ROLE = 0x7e31e6ead72e2d442b946a10ea17b8f55e7aa331f4397c0ef9bb7cf00abdc9f3;
    bytes32 constant public SET_TOKEN_MANAGER_ROLE = 0x6376e9f03a2a03710fd0134497368b6bb4d6a15f1fab7cecd6ed82366e318479;
    bytes32 constant public SET_EQUITY_SETTINGS_ROLE = 0x98ac53226edb559aa863afb7e3ca4cae136504f75748ebb240d6da92fe86b9fd;

    uint64 public constant PCT_BASE = 10 ** 18; // 0% = 0; 1% = 10^16; 100% = 10^18

    uint256 internal constant MAX_UINT256 = uint256(-1);
    uint64 internal constant MAX_UINT64 = uint64(-1);

    string internal constant PAYMENT_REFERENCE = "Employee salary";

    string private constant ERROR_EMPLOYEE_DOESNT_EXIST = "PAYROLL_EMPLOYEE_DOESNT_EXIST";
    string private constant ERROR_NON_ACTIVE_EMPLOYEE = "PAYROLL_NON_ACTIVE_EMPLOYEE";
    string private constant ERROR_SENDER_DOES_NOT_MATCH = "PAYROLL_SENDER_DOES_NOT_MATCH";
    string private constant ERROR_CLIFF_PERIOD_TOO_HIGH = "PAYROLL_CLIFF_PERIOD_TOO_HIGH";
    string private constant ERROR_FINANCE_NOT_CONTRACT = "PAYROLL_FINANCE_NOT_CONTRACT";
    string private constant ERROR_TOKEN_MANAGER_NOT_CONTRACT = "PAYROLL_TOKEN_MANAGER_NOT_CONTRACT";
    string private constant ERROR_DENOMINATION_TOKEN_NOT_CONTRACT = "PAYROLL_DENOMINATION_TOKEN_NOT_CONTRACT";
    string private constant ERROR_DENOMINATION_TOKEN_TOO_HIGH = "PAYROLL_DENOMINATION_TOKEN_TOO_HIGH";
    string private constant ERROR_CAN_NOT_FORWARD = "PAYROLL_CAN_NOT_FORWARD";
    string private constant ERROR_EMPLOYEE_NULL_ADDRESS = "PAYROLL_EMPLOYEE_NULL_ADDRESS";
    string private constant ERROR_EMPLOYEE_ALREADY_EXIST = "PAYROLL_EMPLOYEE_ALREADY_EXIST";
    string private constant ERROR_PAST_TERMINATION_DATE = "PAYROLL_PAST_TERMINATION_DATE";
    string private constant ERROR_NO_SALARY = "PAYROLL_NO_SALARY";
    string private constant ERROR_INVALID_REQUESTED_AMOUNT = "PAYROLL_INVALID_REQUESTED_AMT";

    struct Employee {
        address accountAddress; // unique, but can be changed over time
        uint256 denominationTokenSalary; // salary per second in denomination Token
        uint256 accruedSalary; // keep track of any leftover accrued salary when changing salaries
        uint64 lastPayroll;
        uint64 endDate;
    }

    Finance public finance;
    address public denominationToken;
    TokenManager public equityTokenManager;
    uint64 public equityMultiplier;
    uint64 public vestingLength;
    uint64 public vestingCliffLength;
    bool public vestingRevokable;

    // Employees start at index 1, to allow us to use employees[0] to check for non-existent employees
    uint256 public nextEmployee;
    mapping(uint256 => Employee) internal employees;     // employee ID -> employee
    mapping(address => uint256) internal employeeIds;    // employee address -> employee ID

    event AddEmployee(
        uint256 indexed employeeId,
        address indexed accountAddress,
        uint256 initialDenominationSalary,
        uint64 startDate,
        string role
    );
    event TerminateEmployee(uint256 indexed employeeId, uint64 endDate);
    event SetEmployeeSalary(uint256 indexed employeeId, uint256 denominationSalary);
    event AddEmployeeAccruedSalary(uint256 indexed employeeId, uint256 amount);
    event ChangeAddressByEmployee(uint256 indexed employeeId, address indexed newAccountAddress, address indexed oldAccountAddress);
    event Payday(
        uint256 indexed employeeId,
        address indexed accountAddress,
        address indexed token,
        uint256 denominationAllocation,
        uint256 denominationAmount,
        uint256 equityAmount,
        string metaData
    );
    event EditEquitySettings(uint64 equityMultiplier, uint64 vestingLength, uint64 vestingCliffLength, bool vestingRevokable);

    // Check employee exists by ID
    modifier employeeIdExists(uint256 _employeeId) {
        require(_employeeExists(_employeeId), ERROR_EMPLOYEE_DOESNT_EXIST);
        _;
    }

    // Check employee exists and is still active
    modifier employeeActive(uint256 _employeeId) {
        // No need to check for existence as _isEmployeeIdActive() is false for non-existent employees
        require(_isEmployeeIdActive(_employeeId), ERROR_NON_ACTIVE_EMPLOYEE);
        _;
    }

    // Check sender matches an existing employee
    modifier employeeMatches {
        require(employees[employeeIds[msg.sender]].accountAddress == msg.sender, ERROR_SENDER_DOES_NOT_MATCH);
        _;
    }

    /**
     * @notice Initialize Payroll app for Finance at `_finance` , TokenManager at `_equityTokenManager`, setting denomination token to `_token` and equity multiplier at `_equityMultiplier``
     * @param _finance Address of the Finance app this Payroll app will rely on for payments (non-changeable)
     * @param _denominationToken Address of the denomination token used for salary accounting
     * @param _equityTokenManager Address of the Token Manager app this Payroll app will rely on for equity payments
     * @param _equityMultiplier Used to determine equity earnings
     * @param _vestingLength The length of vestings in seconds, the time when vestings can be completely claimed. Set to 0 to disable vestings
     * @param _vestingCliffLength The vesting cliff in seconds, the time until which vestings cannot be claimed
     * @param _vestingRevokable Whether vestings can be revoked
     */
    function initialize(
        Finance _finance,
        address _denominationToken,
        TokenManager _equityTokenManager,
        uint64 _equityMultiplier,
        uint64 _vestingLength,
        uint64 _vestingCliffLength,
        bool _vestingRevokable
    )
        external
        onlyInit
    {
        initialized();

        require(isContract(_finance), ERROR_FINANCE_NOT_CONTRACT);
        require(isContract(_denominationToken), ERROR_DENOMINATION_TOKEN_NOT_CONTRACT);
        require(isContract(_equityTokenManager), ERROR_TOKEN_MANAGER_NOT_CONTRACT);
        require(_vestingCliffLength <= _vestingLength, ERROR_CLIFF_PERIOD_TOO_HIGH);

        finance = _finance;
        denominationToken = _denominationToken;
        equityTokenManager = _equityTokenManager;
        equityMultiplier = _equityMultiplier;
        vestingLength = _vestingLength;
        vestingCliffLength = _vestingCliffLength;
        vestingRevokable = _vestingRevokable;

        // Employees start at index 1, to allow us to use employees[0] to check for non-existent employees
        nextEmployee = 1;
    }

    /**
     * @notice Set the Finance app to `_finance`
     * @param _finance The new finance app address
     */
    function setFinance(Finance _finance) external auth(SET_FINANCE_ROLE) {
        require(isContract(_finance), ERROR_FINANCE_NOT_CONTRACT);
        finance = _finance;
    }

    /**
     * @notice Set the denomination token to `_denominationToken`
     * @param _denominationToken The new denomination token address
     */
    function setDenominationToken(address _denominationToken) external auth(SET_DENOMINATION_TOKEN_ROLE) {
        require(isContract(_denominationToken), ERROR_DENOMINATION_TOKEN_NOT_CONTRACT);
        denominationToken = _denominationToken;
    }

    /**
     * @notice Set the Equity Token Manager app to `_equityTokenManager`
     * @param _equityTokenManager The new equity token manager app address
     */
    function setEquityTokenManager(TokenManager _equityTokenManager) external auth(SET_TOKEN_MANAGER_ROLE) {
        require(isContract(_equityTokenManager), ERROR_TOKEN_MANAGER_NOT_CONTRACT);
        equityTokenManager = _equityTokenManager;
    }

    /**
     * @notice Set the equity settings to multiplier: `_equityMultiplier`, length: `@transformTime(_vestingLength)`, cliff: `@transformTime(_vestingCliff)`, revokable: `_vestingRevokable`
     * @param _equityMultiplier The new equity multiplier represented as a multiple of 10^18. 0.5x = 5^18; 1x = 10^18; 2x = 20^18
     * @param _vestingLength The length of vestings in seconds, the time when vestings can be completely claimed. Set to 0 to disable vestings
     * @param _vestingCliffLength The vesting cliff in seconds, the time until which vestings cannot be claimed
     * @param _vestingRevokable Whether vestings can be revoked
     */
    function setEquitySettings(uint64 _equityMultiplier, uint64 _vestingLength, uint64 _vestingCliffLength, bool _vestingRevokable)
        external
        auth(SET_EQUITY_SETTINGS_ROLE)
    {
        require(_vestingCliffLength <= _vestingLength, ERROR_CLIFF_PERIOD_TOO_HIGH);

        equityMultiplier = _equityMultiplier;
        vestingLength = _vestingLength;
        vestingCliffLength = _vestingCliffLength;
        vestingRevokable = _vestingRevokable;

        emit EditEquitySettings(_equityMultiplier, _vestingLength, _vestingCliffLength, _vestingRevokable);
    }

    /**
     * @notice Add employee with address `_accountAddress` to payroll with a salary of `@tokenAmount(self.denominationToken(): address, _initialDenominationSalary)` per second, starting on `@formatDate(_startDate)`
     * @param _accountAddress Employee's address to receive payroll
     * @param _initialDenominationSalary Employee's salary, per second in denomination token
     * @param _startDate Employee's starting timestamp in seconds (it actually sets their initial lastPayroll value)
     * @param _role Employee's role
     */
    function addEmployee(address _accountAddress, uint256 _initialDenominationSalary, uint64 _startDate, string _role)
        external
        authP(ADD_EMPLOYEE_ROLE, arr(_accountAddress, _initialDenominationSalary, uint256(_startDate)))
    {
        _addEmployee(_accountAddress, _initialDenominationSalary, _startDate, _role);
    }

    /**
     * @notice Set employee #`_employeeId`'s salary to `@tokenAmount(self.denominationToken(): address, _denominationSalary)` per second
     * @dev This reverts if either the employee's owed salary or accrued salary overflows, to avoid
     *      losing any accrued salary for an employee due to the employer changing their salary.
     * @param _employeeId Employee's identifier
     * @param _denominationSalary Employee's new salary, per second in denomination token
     */
    function setEmployeeSalary(uint256 _employeeId, uint256 _denominationSalary)
        external
        authP(SET_EMPLOYEE_SALARY_ROLE, arr(_employeeId, _denominationSalary, employees[_employeeId].denominationTokenSalary))
        employeeActive(_employeeId)
    {
        Employee storage employee = employees[_employeeId];

        // Accrue employee's owed salary; don't cap to revert on overflow
        uint256 owed = _getOwedSalarySinceLastPayroll(employee, false);
        _addAccruedSalary(_employeeId, owed);

        // Update employee to track the new salary and payment date
        employee.lastPayroll = getTimestamp64();
        employee.denominationTokenSalary = _denominationSalary;

        emit SetEmployeeSalary(_employeeId, _denominationSalary);
    }

    /**
     * @notice Terminate employee #`_employeeId` on `@formatDate(_endDate)`
     * @param _employeeId Employee's identifier
     * @param _endDate Termination timestamp in seconds
     */
    function terminateEmployee(uint256 _employeeId, uint64 _endDate)
        external
        authP(TERMINATE_EMPLOYEE_ROLE, arr(_employeeId, uint256(_endDate)))
        employeeActive(_employeeId)
    {
        _terminateEmployee(_employeeId, _endDate);
    }

    /**
     * @notice Change your employee account address to `_newAccountAddress`
     * @dev Initialization check is implicitly provided by `employeeMatches` as new employees can
     *      only be added via `addEmployee(),` which requires initialization.
     *      As the employee is allowed to call this, we enforce non-reentrancy.
     * @param _newAccountAddress New address to receive payments for the requesting employee
     */
    function changeAddressByEmployee(address _newAccountAddress) external employeeMatches nonReentrant {
        uint256 employeeId = employeeIds[msg.sender];
        address oldAddress = employees[employeeId].accountAddress;

        _setEmployeeAddress(employeeId, _newAccountAddress);
        // Don't delete the old address until after setting the new address to check that the
        // employee specified a new address
        delete employeeIds[oldAddress];

        emit ChangeAddressByEmployee(employeeId, _newAccountAddress, oldAddress);
    }

    /**
     * @notice Request `@formatPct(_denominationTokenAllocation)`% of `@tokenAmount(self.denominationToken(): address, _requestedAmount)` of your salary and the rest as equity
     * @dev Initialization check is implicitly provided by `employeeMatches` as new employees can
     *      only be added via `addEmployee(),` which requires initialization.
     *      As the employee is allowed to call this, we enforce non-reentrancy.
     * @param _denominationTokenAllocation The percent of payment expected in the denomination token, the rest is
            expected in the equity token. 0% = 0; 1% = 10^16; 100% = 10^18
     * @param _requestedAmount Requested amount of the denomination token. Must be less than or equal to total owed
            amount, or a negative number to request all.
     * @param _metaData A reference to some details regarding this payment.
     */
    function payday(uint256 _denominationTokenAllocation, int256 _requestedAmount, string _metaData) external employeeMatches nonReentrant {
        require(_denominationTokenAllocation <= PCT_BASE, ERROR_DENOMINATION_TOKEN_TOO_HIGH);

        uint256 paymentAmount;
        uint256 employeeId = employeeIds[msg.sender];
        Employee storage employee = employees[employeeId];

        // Salary is capped here to avoid reverting at this point if it becomes too big
        // (so employees aren't DDOSed if their salaries get too large)
        // If we do use a capped value, the employee's lastPayroll date will still be reset to now
        uint256 totalOwedSalary = _getTotalOwedCappedSalary(employee);
        require(totalOwedSalary > 0, ERROR_NO_SALARY);

        if (_requestedAmount >= 0) {
            paymentAmount = uint256(_requestedAmount);
        } else {
            paymentAmount = totalOwedSalary;
        }
        require(totalOwedSalary >= paymentAmount, ERROR_INVALID_REQUESTED_AMOUNT);

        // Reset available salary to zero
        employee.accruedSalary = 0;
        employee.lastPayroll = employee.endDate < getTimestamp64() ? employee.endDate : getTimestamp64();

        // Transfer the owed funds
        if (paymentAmount > 0) {
            (uint256 denominationTokenAmount, uint256 equityTokenAmount) = _transferTokensAmount(employeeId, paymentAmount, _denominationTokenAllocation);
        }
        _removeEmployeeIfTerminatedAndPaidOut(employeeId);

        emit Payday(employeeId, employee.accountAddress, denominationToken, _denominationTokenAllocation, denominationTokenAmount, equityTokenAmount, _metaData);
    }

    // Forwarding fns
    /**
     * @dev IForwarder interface conformance. Tells whether the Payroll app is a forwarder or not.
     * @return Always true
     */
    function isForwarder() external pure returns (bool) {
        return true;
    }

    /**
     * @notice Execute desired action as an active employee
     * @dev IForwarder interface conformance. Allows active employees to run EVMScripts in the context of the Payroll app.
     * @param _evmScript Script being executed
     */
    function forward(bytes _evmScript) public {
        require(canForward(msg.sender, _evmScript), ERROR_CAN_NOT_FORWARD);
        bytes memory input = new bytes(0);

        // Add the Finance and Token Manager apps to the blacklist to disallow employees from executing actions on
        // the apps from Payroll's context (since Payroll requires permissions on both apps)
        address[] memory blacklist = new address[](2);
        blacklist[0] = address(finance);
        blacklist[1] = address(equityTokenManager);

        runScript(_evmScript, input, blacklist);
    }

    /**
     * @dev IForwarder interface conformance. Tells whether a given address can forward actions or not.
     * @param _sender Address of the account intending to forward an action
     * @return True if the given address is an active employee, false otherwise
     */
    function canForward(address _sender, bytes) public view returns (bool) {
        return _isEmployeeIdActive(employeeIds[_sender]);
    }

    // Getter fns

    /**
     * @dev Return employee's identifier by their account address
     * @param _accountAddress Employee's address to receive payments
     * @return Employee's identifier
     */
    function getEmployeeIdByAddress(address _accountAddress) public view returns (uint256) {
        require(employeeIds[_accountAddress] != uint256(0), ERROR_EMPLOYEE_DOESNT_EXIST);
        return employeeIds[_accountAddress];
    }

    /**
     * @dev Return all information for employee by their ID
     * @param _employeeId Employee's identifier
     * @return Employee's address to receive payments
     * @return Employee's salary, per second in denomination token
     * @return Employee's accrued salary
     * @return Employee's last payment date
     * @return Employee's termination date (max uint64 if none)
     * @return Employee's allowed payment tokens
     */
    function getEmployee(uint256 _employeeId)
        public
        view
        employeeIdExists(_employeeId)
        returns (
            address accountAddress,
            uint256 denominationSalary,
            uint256 accruedSalary,
            uint64 lastPayroll,
            uint64 endDate
        )
    {
        Employee storage employee = employees[_employeeId];

        accountAddress = employee.accountAddress;
        denominationSalary = employee.denominationTokenSalary;
        accruedSalary = employee.accruedSalary;
        lastPayroll = employee.lastPayroll;
        endDate = employee.endDate;
    }

    /**
     * @dev Get owed salary since last payroll for an employee. It will take into account the accrued salary as well.
     *      The result will be capped to max uint256 to avoid having an overflow.
     * @return Employee's total owed salary: current owed payroll since the last payroll date, plus the accrued salary.
     */
    function getTotalOwedSalary(uint256 _employeeId) public view employeeIdExists(_employeeId) returns (uint256) {
        return _getTotalOwedCappedSalary(employees[_employeeId]);
    }

    // Internal fns

    /**
     * @dev Add a new employee to Payroll
     * @param _accountAddress Employee's address to receive payroll
     * @param _initialDenominationSalary Employee's salary, per second in denomination token
     * @param _startDate Employee's starting timestamp in seconds
     * @param _role Employee's role
     */
    function _addEmployee(address _accountAddress, uint256 _initialDenominationSalary, uint64 _startDate, string _role) internal {
        uint256 employeeId = nextEmployee++;

        _setEmployeeAddress(employeeId, _accountAddress);

        Employee storage employee = employees[employeeId];
        employee.denominationTokenSalary = _initialDenominationSalary;
        employee.lastPayroll = _startDate;
        employee.endDate = MAX_UINT64;

        emit AddEmployee(employeeId, _accountAddress, _initialDenominationSalary, _startDate, _role);
    }

    /**
     * @dev Add amount to an employee's accrued salary
     * @param _employeeId Employee's identifier
     * @param _amount Amount be added to the employee's accrued salary in denomination token
     */
    function _addAccruedSalary(uint256 _employeeId, uint256 _amount) internal {
        Employee storage employee = employees[_employeeId];
        employee.accruedSalary = employee.accruedSalary.add(_amount);
        emit AddEmployeeAccruedSalary(_employeeId, _amount);
    }

    /**
     * @dev Set an employee's account address
     * @param _employeeId Employee's identifier
     * @param _accountAddress Employee's address to receive payroll
     */
    function _setEmployeeAddress(uint256 _employeeId, address _accountAddress) internal {
        // Check address is non-null
        require(_accountAddress != address(0), ERROR_EMPLOYEE_NULL_ADDRESS);
        // Check address isn't already being used
        require(employeeIds[_accountAddress] == uint256(0), ERROR_EMPLOYEE_ALREADY_EXIST);

        employees[_employeeId].accountAddress = _accountAddress;

        // Create IDs mapping
        employeeIds[_accountAddress] = _employeeId;
    }

    /**
     * @dev Terminate employee on end date
     * @param _employeeId Employee's identifier
     * @param _endDate Termination timestamp in seconds
     */
    function _terminateEmployee(uint256 _employeeId, uint64 _endDate) internal {
        // Prevent past termination dates
        require(_endDate >= getTimestamp64(), ERROR_PAST_TERMINATION_DATE);
        employees[_employeeId].endDate = _endDate;
        emit TerminateEmployee(_employeeId, _endDate);
    }

    /**
     * @dev Transfer denomination and equity tokens to employee dependant on requested allocation.
     * @param _employeeId Employee's identifier
     * @param _totalAmount Total amount to be transferred to the employee distributed in accordance to the employee's token allocation.
     * @param _denominationTokenAllocation The percent of payment expected in the denomination token, the rest is
            expected in the equity token. 0% = 0; 1% = 10^16; 100% = 10^18
     * @return True if there was at least one token transfer
     */
    function _transferTokensAmount(uint256 _employeeId, uint256 _totalAmount, uint256 _denominationTokenAllocation)
    internal
    returns (uint256, uint256)
    {
        Employee storage employee = employees[_employeeId];

        uint256 denominationTokenAmount = _totalAmount.mul(_denominationTokenAllocation).div(PCT_BASE);
        uint256 equityTokenAmount = (_totalAmount.sub(denominationTokenAmount)).mul(equityMultiplier).div(PCT_BASE);

        if (denominationTokenAmount > 0) {
            // Finance reverts if the payment wasn't possible
            finance.newImmediatePayment(denominationToken, employee.accountAddress, denominationTokenAmount, PAYMENT_REFERENCE);
        }

        if (equityTokenAmount > 0) {
            if (vestingLength > 0) {
                uint64 vestingCliffTime = getTimestamp64().add(vestingCliffLength);
                uint64 vestingEnd = getTimestamp64().add(vestingLength);
                equityTokenManager.assignVested(employee.accountAddress, equityTokenAmount, getTimestamp64(),
                    vestingCliffTime, vestingEnd, vestingRevokable);
            } else {
                equityTokenManager.mint(employee.accountAddress, equityTokenAmount);
            }
        }

        return (denominationTokenAmount, equityTokenAmount);
    }

    /**
     * @dev Remove employee if there are no owed funds and employee's end date has been reached
     * @param _employeeId Employee's identifier
     */
    function _removeEmployeeIfTerminatedAndPaidOut(uint256 _employeeId) internal {
        Employee storage employee = employees[_employeeId];

        if (
            employee.lastPayroll == employee.endDate &&
            employee.accruedSalary == 0
        ) {
            delete employeeIds[employee.accountAddress];
            delete employees[_employeeId];
        }
    }

    /**
     * @dev Tell whether an employee is registered in this Payroll or not
     * @param _employeeId Employee's identifier
     * @return True if the given employee ID belongs to an registered employee, false otherwise
     */
    function _employeeExists(uint256 _employeeId) internal view returns (bool) {
        return employees[_employeeId].accountAddress != address(0);
    }

    /**
     * @dev Tell whether an employee is still active or not
     * @param _employee Employee struct in storage
     * @return True if the employee exists and has an end date that has not been reached yet, false otherwise
     */
    function _isEmployeeActive(Employee storage _employee) internal view returns (bool) {
        return _employee.endDate >= getTimestamp64();
    }

    /**
     * @dev Tell whether an employee id is still active or not
     * @param _employeeId Employee's identifier
     * @return True if the employee exists and has an end date that has not been reached yet, false otherwise
     */
    function _isEmployeeIdActive(uint256 _employeeId) internal view returns (bool) {
        return _isEmployeeActive(employees[_employeeId]);
    }


    /**
     * @dev Get owed salary since last payroll for an employee
     * @param _employee Employee struct in storage
     * @param _capped Safely cap the owed salary at max uint
     * @return Owed salary in denomination tokens since last payroll for the employee.
     *         If _capped is false, it reverts in case of an overflow.
     */
    function _getOwedSalarySinceLastPayroll(Employee storage _employee, bool _capped) internal view returns (uint256) {
        uint256 timeDiff = _getOwedPayrollPeriod(_employee);
        if (timeDiff == 0) {
            return 0;
        }
        uint256 salary = _employee.denominationTokenSalary;

        if (_capped) {
            // Return max uint if the result overflows
            uint256 result = salary * timeDiff;
            return (result / timeDiff != salary) ? MAX_UINT256 : result;
        } else {
            return salary.mul(timeDiff);
        }
    }

    /**
     * @dev Get owed payroll period for an employee
     * @param _employee Employee struct in storage
     * @return Owed time in seconds since the employee's last payroll date
     */
    function _getOwedPayrollPeriod(Employee storage _employee) internal view returns (uint256) {
        // Get the min of current date and termination date
        uint64 date = _isEmployeeActive(_employee) ? getTimestamp64() : _employee.endDate;

        // Make sure we don't revert if we try to get the owed salary for an employee whose last
        // payroll date is now or in the future
        // This can happen either by adding new employees with start dates in the future, to allow
        // us to change their salary before their start date, or by terminating an employee and
        // paying out their full owed salary
        if (date <= _employee.lastPayroll) {
            return 0;
        }

        // Return time diff in seconds, no need to use SafeMath as the underflow was covered by the previous check
        return uint256(date - _employee.lastPayroll);
    }

    /**
     * @dev Get owed salary since last payroll for an employee. It will take into account the accrued salary as well.
     *      The result will be capped to max uint256 to avoid having an overflow.
     * @param _employee Employee struct in storage
     * @return Employee's total owed salary: current owed payroll since the last payroll date, plus the accrued salary.
     */
    function _getTotalOwedCappedSalary(Employee storage _employee) internal view returns (uint256) {
        uint256 currentOwedSalary = _getOwedSalarySinceLastPayroll(_employee, true); // cap amount
        uint256 totalOwedSalary = currentOwedSalary + _employee.accruedSalary;
        if (totalOwedSalary < currentOwedSalary) {
            totalOwedSalary = MAX_UINT256;
        }
        return totalOwedSalary;
    }
}