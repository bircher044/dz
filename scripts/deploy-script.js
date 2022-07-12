const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners()

  const Erc20RedDuck = await ethers.getContractFactory('erc20RedDuck', signer);
  const erc20RedDuck = await Erc20RedDuck.deploy(18, 1000, BigNumber.from("1000000000000000000"), 50);  // decimals, totalSupply, coin_price, voting_duration
  await erc20RedDuck.deployed();
  console.log(erc20RedDuck.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
