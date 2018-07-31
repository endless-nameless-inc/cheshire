/* global artifacts */
/* global contract */
/* global assert */

const GeneScience = artifacts.require('GeneScience')
const KittyCore = artifacts.require('KittyCore')
const SaleClockAuction = artifacts.require('SaleClockAuction')
const SiringClockAuction = artifacts.require('SiringClockAuction')

contract('KittyCore', async (accounts) => {
  const ownerCut = 375
  let kittyCore
  let saleClockAuction
  let siringClockAuction
  let geneScience

  // Re-deploy and re-initialize contracts between each test
  beforeEach(async () => {
    kittyCore = await KittyCore.new()
    saleClockAuction = await SaleClockAuction.new(kittyCore.address, ownerCut)
    siringClockAuction = await SiringClockAuction.new(kittyCore.address, ownerCut)
    geneScience = await GeneScience.new()

    kittyCore.setSaleAuctionAddress(saleClockAuction.address)
    kittyCore.setSiringAuctionAddress(siringClockAuction.address)
    kittyCore.setGeneScienceAddress(geneScience.address)
    kittyCore.unpause()
  })

  describe('approve', async () => {
    let kittyId

    beforeEach(async () => {
      const kittyArgs = [
        0, // matron ID
        0, // sire ID
        0, // generation
        0, // genes
        accounts[0], // owner
      ]

      kittyId = await kittyCore.createKitty.call(...kittyArgs)
      kittyCore.createKitty(...kittyArgs)
    })

    it('no account has approval in base state', async () => {
      const approvedAddress = await kittyCore.kittyIndexToApproved(kittyId)
      assert.equal(0, approvedAddress)
    })

    it('approve should grant approval', async () => {
      await kittyCore.approve(accounts[1], kittyId)
      const approvedAddress = await kittyCore.kittyIndexToApproved(kittyId)
      assert.equal(accounts[1], approvedAddress)
    })
  })
})
