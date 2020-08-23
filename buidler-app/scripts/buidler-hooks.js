const { getNewProxyAddress } = require("@aragon/test-helpers/events");

let appManager, user, anyAcc;

let acl;
let priceFeed, finance;
let token1, token2, token3;

// namehas(vault.aragonpm.eth)
const vaultAppId =
  "0xce74f3ee34b4d8bb871ec3628e2c57e30f1df24679790b7b6338e457554c5439";
// namehas(finance.aragonpm.eth)
const financeAppId =
  "0x7e852e0fcfce6551c13800f1e7476f982525c2b5277ba14b24339c68416336d1";

const ANY_ENTITY = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

const USD = "0xFFFfFfffffFFFFFFFfffFFFFFffffFfFfFAAaCbB"; // USD identifier
const ONE_MONTH = 60 * 60 * 24 * 31;
const TWO_MONTHS = ONE_MONTH * 2;
const RATE_EXPIRATION_TIME = TWO_MONTHS;

module.exports = {
  postDao: async function({ dao }, bre) {
    await _getAccounts(bre.web3);

    // Get ACL
    acl = await bre.artifacts.require("ACL").at(await dao.acl());

    await _installFinance(dao, bre);
    console.log(`> Finance app proxy installed: ${finance.address}`);

    await _deployTokens(bre.artifacts);
    // await _depositTokens(); TODO: fix, not working yet
  },

  preInit: async function({}, bre) {
    priceFeed = await _deployContract(bre.artifacts, "PriceFeedMock");
  },

  getInitParams: async function({}, bre) {
    return [finance.address, USD, priceFeed.address, RATE_EXPIRATION_TIME];
  }
};

async function _installFinance(dao, bre) {
  // Get bases and roles
  const vaultBase = await _deployContract(bre.artifacts, "Vault");
  const TRANSFER_ROLE = await vaultBase.TRANSFER_ROLE();
  const financeBase = await _deployContract(bre.artifacts, "Finance");
  const CREATE_PAYMENTS_ROLE = await financeBase.CREATE_PAYMENTS_ROLE();

  // Create proxies and permissions
  const financeReceipt = await dao.newAppInstance(
    financeAppId,
    financeBase.address,
    "0x",
    false,
    { from: appManager }
  );
  finance = await bre.artifacts
    .require("Finance")
    .at(getNewProxyAddress(financeReceipt));
  await acl.createPermission(
    ANY_ENTITY,
    finance.address,
    CREATE_PAYMENTS_ROLE,
    appManager,
    { from: appManager }
  );

  const vaultReceipt = await dao.newAppInstance(
    vaultAppId,
    vaultBase.address,
    "0x",
    false,
    { from: appManager }
  );
  const vault = await bre.artifacts
    .require("Vault")
    .at(getNewProxyAddress(vaultReceipt));
  await acl.createPermission(
    finance.address,
    vault.address,
    TRANSFER_ROLE,
    appManager,
    { from: appManager }
  );

  // Initialize
  await vault.initialize();
  await finance.initialize(vault.address, ONE_MONTH);
}

async function _deployContract(artifacts, contractName) {
  const contractArtifact = artifacts.require(contractName);

  contractInstance = await contractArtifact.new({ from: appManager });
  console.log(`> ${contractName} deployed: ${contractInstance.address}`);
  return contractInstance;
}

async function _getAccounts(web3) {
  [appManager, user, anyAcc] = await web3.eth.getAccounts();
}

async function _deployTokens(artifacts) {
  token1 = await _deployToken("token1", "TK1", 1, 4500, anyAcc, artifacts);
  console.log(`> Token1 deployed: ${token1.address}`);

  token2 = await _deployToken("token2", "TK2", 1, 4500, anyAcc, artifacts);
  console.log(`> Token2 deployed: ${token2.address}`);

  token3 = await _deployToken("token3", "TK3", 1, 4500, anyAcc, artifacts);
  console.log(`> Token3 deployed: ${token3.address}`);
}

async function _deployToken(
  tokenName,
  tokenSymbol,
  decimals,
  initialSupply,
  fromAccount,
  artifacts
) {
  const ERC20 = artifacts.require("ERC20Mock");

  return ERC20.new(tokenName, tokenSymbol, decimals, initialSupply, {
    from: fromAccount
  });
}

// async function _depositTokens() {
//   await token1.approve(finance.address, 2000, { from: appManager });
//   await finance.deposit(token1.address, 2000, "Initial deployment", {
//     from: appManager
//   });
//   console.log(`> Deposit 2000 tk1 on finance.`);

//   await token2.approve(finance.address, 1000, { from: appManager });
//   await finance.deposit(token2.address, 1000, "Initial deployment", {
//     from: appManager
//   });
//   console.log(`> Deposit 1000 tk2 on finance.`);

//   await token3.approve(finance.address, 3000, { from: appManager });
//   await finance.deposit(token3.address, 3000, "Initial deployment", {
//     from: appManager
//   });
//   console.log(`> Deposit 3000 tk3 on finance.`);
// }
