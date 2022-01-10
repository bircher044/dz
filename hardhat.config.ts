import "@nomiclabs/hardhat-waffle";
import { task } from "hardhat/config";
import "hardhat-deploy-ethers";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

export default {
  solidity: "0.8.4",
};