import { ethers } from "hardhat";
import { Contract, BigNumber, Wallet, ContractFactory, providers } from "ethers"; 
import { expect } from "chai";
import "console";

type ProviderData = {
  balance : BigNumber;
}

type ContractData = {
  balance : BigNumber;
}

type WalletData = {
  provider : ProviderData;
  contract : ContractData;
}

describe("erc20RedDuck contract", async () => {

  let contract : Contract;
  
  let totalSupply : BigNumber;
  let availableSupply : BigNumber;
  let coinPrice : BigNumber;
  let votingDuration : BigNumber;
  let decimals : BigNumber;

  let testWallet : Wallet;

  let contractWallet_ProviderBalance : BigNumber;
  let contractWallet_ContractBalance : BigNumber;

  let testWallet_ProviderBalance : BigNumber;
  let testWallet_ContractBalance : BigNumber;


  beforeEach( async () => {

    const testWalletPrivateKey : string = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    testWallet = new Wallet(testWalletPrivateKey, ethers.provider);

    let contractFactory : ContractFactory = await ethers.getContractFactory('erc20RedDuck');
    
    totalSupply = BigNumber.from(1000);
    availableSupply = totalSupply;
    coinPrice = BigNumber.from(4500);
    votingDuration = BigNumber.from(3000);
    decimals = BigNumber.from(18);

    contract = await contractFactory.deploy(decimals, totalSupply, coinPrice, votingDuration);

    contractWallet_ProviderBalance = await ethers.provider.getBalance(contract.address);
    contractWallet_ContractBalance = totalSupply;

    testWallet_ContractBalance = BigNumber.from(0);

  });

  describe('Deployment', async () => {    //этот блок тестов отвечает за то, правильно ли развернулся контракт

    it('Should set right owner', async () => {
      const responseOwnerAddress = await contract.getOwner();

      expect(responseOwnerAddress).to.equal(contract.address);  //contact.adress это всегда оwner. В принципе, ownera можно и не запоминать в контракте
   });

    it('Should set right total supply', async () => {
      const responseTotalSupply = await contract.totalSupply();

      expect(responseTotalSupply).to.equal(totalSupply);
    });

    it('Should set right token rate', async() => {
      const responseTokenRate = await contract.currentCoinPrice();

      expect(responseTokenRate).to.equal(coinPrice);
    });

    it('Should signed total supply of tokens to the owner', async () => {
      const responseOwnerBalance = await contract.balanceOf(contract.address);     //в начале totalsupply должен быть у овнера

      expect(responseOwnerBalance).to.equal(totalSupply);
    }); 
  });
dsdfs



  });


});