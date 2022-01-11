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
  let coinPrice : BigNumber;
  let votingDuration : BigNumber;

  let firstWallet : Wallet;
  let secondWallet : Wallet;

  let contractWalletProviderBalance : BigNumber;
  let contractWalletContractBalance : BigNumber;
  let firstWalletProviderBalance : BigNumber;
  let firstWalletContractBalance : BigNumber;
  let secondWalletProviderBalance : BigNumber;
  let secondWalletContractBalance : BigNumber;



  beforeEach(async () => {
    var firstWalletPrivateKey : string = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    var secondWalletPrivateKey : string = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

    firstWallet = new Wallet(firstWalletPrivateKey, ethers.provider);
    secondWallet = new Wallet(secondWalletPrivateKey, ethers.provider);

    var contractFactory : ContractFactory = await ethers.getContractFactory('erc20RedDuck');
    
    totalSupply = BigNumber.from(1000);
    coinPrice = BigNumber.from(4500);
    votingDuration = BigNumber.from(50);

    contract = await contractFactory.deploy(totalSupply, coinPrice, votingDuration);

    contractWalletProviderBalance = await ethers.provider.getBalance(contract.address);
    contractWalletContractBalance = totalSupply;

    firstWalletProviderBalance = await ethers.provider.getBalance(firstWallet.address);
    firstWalletContractBalance = BigNumber.from(0);

    secondWalletProviderBalance = await ethers.provider.getBalance(secondWallet.address);
    secondWalletContractBalance = BigNumber.from(0);
  });


  



  describe('Deployment', async () => {

   // it('Should set right owner', async () => {
   //   const responseOwnerAddress = await contract.getOwner();
//
  //    expect(responseOwnerAddress).to.equal(contract.address);
  //n  });

    it('Should set right total supply', async () => {
      const responseTotalSupply = await contract.totalSupply();

      expect(responseTotalSupply).to.equal(totalSupply);
    });

    it('Should set right token rate', async() => {
      const responseTokenRate = await contract.CurrentCoinPrice();

      expect(responseTokenRate).to.equal(coinPrice);
    });

    it('Should signed total supply of tokens to the owner', async () => {
      const responseOwnerBalance = await contract.balanceOf(contract.address);

      expect(responseOwnerBalance).to.equal(totalSupply);
    }); 

    it('Should set right voting duration', async() => {
      const responseVotingDuration = await contract.votingDuration();

      expect(responseVotingDuration).to.equal(votingDuration);
    });
  });


  describe('Buy', async () => {

    it('Should be bought', async () => {
      let override = {
        value : BigNumber.from(1000)
      };

      await contract.connect(firstWallet).buy(override);
      
      firstWalletContractBalance = firstWalletContractBalance.add(await override.value.mul(coinPrice));
      
      expect(await contract.balanceOf(firstWallet.address)).to.equal(firstWalletContractBalance);
    });

  });

/*
  describe('Transactions - transfer', () => {
    afterEach(async () => {
      expect(await contract.balanceOf(contract.address)).to.equal(contractWalletContractBalance);
  
      expect(await contract.balanceOf(firstWallet.address)).to.equal(firstWalletContractBalance);
  
      expect(await contract.balanceOf(secondWallet.address)).to.equal(secondWalletContractBalance);
    });
    it('Should transfer tokens between account', async () =>{
      await contract.transfer(firstWallet.address, 100);
      firstWalletContractBalance = firstWalletContractBalance.add(100);
      contractWalletContractBalance = contractWalletContractBalance.sub(100);
      await contract.transfer(secondWallet.address, 150);
      secondWalletContractBalance = secondWalletContractBalance.add(150);
      contractWalletContractBalance = contractWalletContractBalance.sub(150);
    });
    it('Should fail if sender doesnt have enough tokens', async () =>{
      await expect(contract.connect(firstWallet).transfer(secondWallet.address, firstWalletContractBalance.add(1))).to.be.revertedWith('Transfer amount exceeds balance');
    });
  });
*/

/*
  describe('Buy Action', () => {
    it('Should be bought', async () =>{
      const override =  {
        value: 100
      };
      const amount = override.value * currentTokenRate;
      await token.connect(Addr1).Buy(override);
      addr1Balance += amount;
      ownerBalance -= amount;
      const responseAddr1Balance : number = parseInt(await token.Balance(addr1));
      expect(responseAddr1Balance).to.equal(addr1Balance);
      const responseOwnerBalance : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance).to.equal(ownerBalance);
    });
    it('Shouldnt be bought if value is less or equal to 0', async() =>{
      const override =  {
        value: 0
      };
      await expect(token.connect(Addr1).Buy(override)).to.be.revertedWith('Value should be greater than 0');
      const responseAddr1Balance : number = parseInt(await token.Balance(addr1));
      expect(responseAddr1Balance).to.equal(addr1Balance);
      const responseOwnerBalance : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance).to.equal(ownerBalance);
    }); 
    it('Shouldnt be bought if value is greater than available supply', async() =>{
      const override =  {
        value: 1000000000000000
      };
      await expect(token.connect(Addr1).Buy(override)).to.be.revertedWith('Not enough available supply');
      const responseAddr1Balance : number = parseInt(await token.Balance(addr1));
      expect(responseAddr1Balance).to.equal(addr1Balance);
      const responseOwnerBalance : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance).to.equal(ownerBalance);
    });
  });
  describe('Sell Action', () => {
    it('Should be sold', async ()=>{
      const amount : number = 100 * currentTokenRate;
      await token.Transfer(addr1, amount);
      addr1Balance += amount;
      ownerBalance -= amount;
      const responseAddr1Balance_afterTransferAction : number = parseInt(await token.Balance(addr1));
      expect(responseAddr1Balance_afterTransferAction).to.equal(addr1Balance);
      const responseOwnerBalance_afterTransferAction : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance_afterTransferAction).to.equal(ownerBalance);
      await token.connect(Addr1).Sell(amount);
      addr1Balance -= amount;
      ownerBalance += amount;
      const responseAddr1Balance_afterSellAction : number = parseInt(await token.Balance(addr1));
      expect(responseAddr1Balance_afterSellAction).to.equal(addr1Balance);
      const responseOwnerBalance_afterSellAction : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance_afterSellAction).to.equal(ownerBalance);
    });
    it('Shouldnt be sold if requested amount is less or equal to 0', async ()=>{
      const amount : number = 0;
      await expect(token.connect(Addr1).Sell(amount)).to.be.revertedWith('Requested amount should be greater than 0');
      const responseAddr1Balance_afterSellAction : number = parseInt(await token.Balance(addr1));
      expect(responseAddr1Balance_afterSellAction).to.equal(addr1Balance);
      const responseOwnerBalance_afterSellAction : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance_afterSellAction).to.equal(ownerBalance);
    });
    it('Shouldnt be sold if requested amount is greater than balance', async ()=>{
      const amount : number = addr1Balance + 1;
      await expect(token.connect(Addr1).Sell(amount)).to.be.revertedWith('Requested amount should be less or equal to your balance');
      const responseAddr1Balance_afterSellAction : number = parseInt(await token.Balance(addr1));
      expect(responseAddr1Balance_afterSellAction).to.equal(addr1Balance);
      const responseOwnerBalance_afterSellAction : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance_afterSellAction).to.equal(ownerBalance);
    });
  });
  describe('Change Token Rate', () => {
    it('Should be changed', async() =>{
      const newTokenRate = currentTokenRate + 1;
      
      await token.connect(Owner).ChangeTokenRate(newTokenRate);
      currentTokenRate = newTokenRate;
      const responseCurrentTokenRate = parseInt(await token.CurrentTokenRate());
      expect(responseCurrentTokenRate).to.equal(currentTokenRate);
    }); 
    it('Shouldnt be changed if sender is not owner', async() =>{
      const newTokenRate = currentTokenRate + 1;
      
      await expect(token.connect(Addr1).ChangeTokenRate(newTokenRate)).to.be.revertedWith('Only owner cant change token rate');
      const responseCurrentTokenRate = parseInt(await token.CurrentTokenRate());
      expect(responseCurrentTokenRate).to.equal(currentTokenRate);
    }); 
    it('Shouldnt be changed if new token rate is less or equal to 0', async() =>{
      const newTokenRate = 0;
      
      await expect(token.connect(Owner).ChangeTokenRate(newTokenRate)).to.be.revertedWith('New token rate should be greater than 0');
      const responseCurrentTokenRate = parseInt(await token.CurrentTokenRate());
      expect(responseCurrentTokenRate).to.equal(currentTokenRate);
    }); */

  });