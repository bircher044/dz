const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners()

  const Erc20RedDuck = await ethers.getContractFactory('hackERC20RedDuck', signer);
  const erc20RedDuck = await Erc20RedDuck.deploy('0x5FbDB2315678afecb367f032d93F642f64180aa3');  
  await erc20RedDuck.deployed();
  console.log(erc20RedDuck.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
