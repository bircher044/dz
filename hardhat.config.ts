import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy-ethers";

export default {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      chainId: 1337
    }
  }
};