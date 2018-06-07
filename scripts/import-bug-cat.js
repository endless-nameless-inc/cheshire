module.exports = async function importBugCat(cheshire) {
  const bugCatIdMainnet = 101
  const ownerTestnet = cheshire.accounts[0].address
  const kittyIdTestnet = await cheshire.importKitty(bugCatIdMainnet, ownerTestnet)

  console.log(`Kitty #${kittyIdTestnet} => ${ownerTestnet}`)
}
