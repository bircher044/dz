const hre = require ('hardhat')
const ethers = hre.ethers

async function main(){
    const [acc1, acc2] = await ethers.getSigners()
    const contractAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
}