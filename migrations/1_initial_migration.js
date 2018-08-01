const Migrations = artifacts.require("./Migrations.sol")
const GeneScience = artifacts.require("./GeneScience.sol")
const KittyCore = artifacts.require("./KittyCore.sol")
const SaleClockAuction = artifacts.require("./SaleClockAuction.sol")
const SiringClockAuction = artifacts.require("./SiringClockAuction.sol")

module.exports = (deployer, network) => {
  deployer.then(async () => {
    const migrations = await deployer.deploy(Migrations)
    console.log('Migrations contract deployed at', migrations.address)

    const kittyCore = await deployer.deploy(KittyCore)
    console.log('KittyCore contract deployed at', kittyCore.address)

    const ownerCut = 375

    const saleClockAuction = await deployer.deploy(SaleClockAuction, kittyCore.address, ownerCut)
    console.log('SaleClockAuction contract deployed at', saleClockAuction.address)

    const siringClockAuction = await deployer.deploy(SiringClockAuction, kittyCore.address, ownerCut)
    console.log('SiringClockAuction contract deployed at', siringClockAuction.address)

    const geneScience = await deployer.deploy(GeneScience)
    console.log('GeneScience contract deployed at', geneScience.address)

    await kittyCore.setSaleAuctionAddress(saleClockAuction.address)
    await kittyCore.setSiringAuctionAddress(siringClockAuction.address)
    await kittyCore.setGeneScienceAddress(geneScience.address)
    await kittyCore.unpause()

    console.log('KittyCore unpaused')
  })
}
