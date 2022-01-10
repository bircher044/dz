import { ethers } from "hardhat";
import type { ContractFactory, Contract, Signer } from "ethers";
const { expect } = require("chai");
import "console";

describe("Token contract", () => {
  let ownerBalance : number;
  let addr1Balance : number;
  let addr2Balance : number;
  let CurrentCoinPrice : number;
  let Owner : Signer;
  let Addr1 : Signer;
  let Addr2 : Signer;
  let owner : string;
  let addr1 : string;
  let addr2 : string;
  let Token : ContractFactory;
  let token : Contract;


  beforeEach(async () =>{
    Token = await ethers.getContractFactory('erc20RedDuck') as ContractFactory;
    token = await Token.deploy() as Contract;

    token.deployed();

    [Owner, Addr1, Addr2]  = await ethers.getSigners() as Signer[];

    owner = await Owner.getAddress();
    addr1 = await Addr1.getAddress();
    addr2 = await Addr2.getAddress();

    ownerBalance = parseInt(await token.Balance(owner));
    addr1Balance = parseInt(await token.Balance(addr1));
    addr2Balance = parseInt(await token.Balance(addr2));

    CurrentCoinPrice = parseInt(await token.CurrentCoinPrice());
  });



  describe('Deployment', () => {

    it('Should show the total supply before the contract listed.', async () =>{
      const responseTotalSupply = parseInt(await token.TotalSupply());

      expect(responseTotalSupply).to.equal(ownerBalance);
    }); 
   
    
   
  });



  describe('buy', () => {
    it('Should be bought', async () =>{
    const override = {
      value : 100
    };

    const amount = override.value / CurrentCoinPrice;

    await token.connect(Addr1).Buy(override);

    addr1Balance += amount;
    ownerBalance -= amount;

    const responseAddr1

    })

    
    

  });
}
