/*import { ethers } from "hardhat";
import type { ContractFactory, Contract, Signer } from "ethers";
const { expect } = require("chai");
import "console";

describe("Token contract", () => {
  let ownerBalance : number;
  let addr1Balance : number;
  let addr2Balance : number;
  let currentTokenRate : number;
  let Owner : Signer;
  let Addr1 : Signer;
  let Addr2 : Signer;
  let owner : string;
  let addr1 : string;
  let addr2 : string;
  let Token : ContractFactory;
  let token : Contract;


  beforeEach(async () =>{
    Token = await ethers.getContractFactory('MyToken') as ContractFactory;
    token = await Token.deploy() as Contract;

    token.deployed();

    [Owner, Addr1, Addr2]  = await ethers.getSigners() as Signer[];

    owner = await Owner.getAddress();
    addr1 = await Addr1.getAddress();
    addr2 = await Addr2.getAddress();

    ownerBalance = parseInt(await token.Balance(owner));
    addr1Balance = parseInt(await token.Balance(addr1));
    addr2Balance = parseInt(await token.Balance(addr2));

    currentTokenRate = parseInt(await token.CurrentTokenRate());
  });



  describe('Deployment', () => {

    it('Should show the total supply.', async () =>{
      const responseTotalSupply = parseInt(await token.TotalSupply());

      expect(responseTotalSupply).to.equal(ownerBalance);
    }); 

    it('Available supply should be equal to owner balance', async() =>{
      const responseAvailableSupply = parseInt(await token.AvailableSupply());

      expect(responseAvailableSupply).to.equal(ownerBalance);
    });

    it('Current token ratio should be 13', async() =>{
      const responseCurrentTokenRate = parseInt(await token.CurrentTokenRate());

      expect(responseCurrentTokenRate).to.equal(13);
    })

  });



  describe('Transactions', () => {

    it('Should transfer tokens between account', async () =>{
      await token.Transfer(addr1, 100);
      addr1Balance += 100;
      ownerBalance -= 100;

      await token.Transfer(addr2, 150);
      addr2Balance += 150;
      ownerBalance -= 150;

      const responseOwnerBalance : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance).to.equal(ownerBalance);
      
      const responseAddr1Balance : number = parseInt(await token.Balance(addr1));
      expect(responseAddr1Balance).to.equal(addr1Balance);

      const responseAddr2Balance : number = parseInt(await token.Balance(addr2));
      expect(responseAddr2Balance).to.equal(addr2Balance);
    });

    it('Should fail if sender doesnt have enough tokens', async () =>{
      await expect(token.connect(Addr1).Transfer(owner, 1)).to.be.revertedWith('Not enough tokens');

      const responseOwnerBalance : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance).to.equal(ownerBalance);
    });

    it('Should fail if amount is not greater than 0', async () =>{
      await expect(token.connect(Addr1).Transfer(owner, -1)).to.be.revertedWith('Amount should be greater than 0');

      const responseOwnerBalance : number = parseInt(await token.Balance(owner));
      expect(responseOwnerBalance).to.equal(ownerBalance);
    });

  });



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
    }); 

  });


  
});
*/