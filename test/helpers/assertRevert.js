let { assertRevert } = require('@aragon/test-helpers/assertThrow')

const originalAssertRevert = assertRevert

assertRevert = async (functionCall, errorMessage) => {
  await originalAssertRevert(functionCall, `Returned error:  ${errorMessage}`)
}

module.exports = { assertRevert }