const GeneScience = artifacts.require("./GeneScience.sol")
const KittyCore = artifacts.require("./KittyCore.sol")
const SaleClockAuction = artifacts.require("./SaleClockAuction.sol")
const SiringClockAuction = artifacts.require("./SiringClockAuction.sol")

module.exports = (deployer, network) => {
  deployer.then(async () => {
    const kittyCore = await deployer.deploy(KittyCore)
    console.log('kittyCore deployed at', kittyCore.address)

    const ownerCut = 375

    const saleClockAuction = await deployer.deploy(SaleClockAuction, kittyCore.address, ownerCut)
    console.log('SaleClockAuction deployed at', saleClockAuction.address)

    const siringClockAuction = await deployer.deploy(SiringClockAuction, kittyCore.address, ownerCut)
    console.log('SiringClockAuction deployed at', siringClockAuction.address)

    const geneScience = await deployer.deploy(GeneScience)
    console.log('geneScience deployed at', geneScience.address)

    await kittyCore.setSaleAuctionAddress(saleClockAuction.address)
    await kittyCore.setSiringAuctionAddress(siringClockAuction.address)
    await kittyCore.setGeneScienceAddress(geneScience.address)
    await kittyCore.unpause()

    console.log('KittyCore unpaused')
  })
}
