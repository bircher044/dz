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

    it('Should set right voting duration', async() => {
      const responseVotingDuration = await contract.votingDuration();

      expect(responseVotingDuration).to.equal(votingDuration);
    });
  });









  describe('Buy', async () => {

    beforeEach( async () => {

      contractWallet_ProviderBalance = await ethers.provider.getBalance(contract.address); //ethers.provide.getBalance возвращает количество gwei на кошельке

    });

    afterEach( async () => {

      const response_ContractWallet_ProviderBalance = await ethers.provider.getBalance(contract.address);    //баланс контракта (gwei) в нашем контракте
      expect(response_ContractWallet_ProviderBalance).to.equal(contractWallet_ProviderBalance);  //сравниваем баланс контракта (gwei) в сети и в тестах
 
    });


    it('Should be bought', async () => { // проверяем "купится" ли токен при отправке gwei на контракте

      let override = {
        value : BigNumber.from(1000)
      };

      await contract.connect(testWallet).buy(override); // запускаем функцию buy, в которую с нашего тест кошелька отправляем gwei = .value

      testWallet_ContractBalance = testWallet_ContractBalance.add(override.value.div(coinPrice));
      //добавляем на кошелёк покупателя
      //целочисленное деление override.value на цену токена ( количество токенов которые получить купить покупатель)

      contractWallet_ContractBalance = contractWallet_ContractBalance.sub(override.value.div(coinPrice));
      //отнимаем от кошелька контракта
      //целочисленное деление override.value на цену токена ( количество токенов которые получить купить покупатель)

      contractWallet_ProviderBalance = contractWallet_ProviderBalance.add(override.value);
      //добавляем на кошелёк контракта отправленный эфир

    });

    it('Should not be bought', async () => {

      let override = {
        value : availableSupply.add(1).mul(coinPrice)   //кошелёк пытается купить на 1 токен больше, чем доступно на контракте
      };

      await expect(contract.connect(testWallet).buy(override)).to.be.revertedWith('Cannot sell Oleksiirium for now'); 
      //транзакция ревертнулась когда кошелёк попытался купить больше чем баланс контракта

    });

  });


  describe('Sell', async () => {

    it('Should be sold', async () => { // проверяем "продастся" ли токен при отправке токена на контракт

      let override = {
        value : BigNumber.from(45000)
      };
      await contract.connect(testWallet).buy(override);

      testWallet_ContractBalance = testWallet_ContractBalance.add(override.value.div(coinPrice)); //на тестовый кошелёк покупаем токены на 45000 gwei (должно получиться 10 olx по текущему курсу). Эти токены будем сейчас продавать

      const tokensToSell = BigNumber.from(10);  

      await contract.connect(testWallet).sell(tokensToSell); // запускаем функцию sell, в которую с нашего тест кошелька отправляем сколько хотим продать olx = 10

      contractWallet_ContractBalance = contractWallet_ContractBalance.add(tokensToSell);
      // добавляем на кошелёк контракта olx

      testWallet_ContractBalance = testWallet_ContractBalance.sub(tokensToSell);
      // отнимаем с кошелька продавца olx

      expect(testWallet_ContractBalance).to.equal(await contract.balanceOf(testWallet.address));

    });

    it('Should not be sold', async () => { // проверяем отменится ли транзакция, если попытаться продать больше olx чем есть на балансе

      let override = {
        value : BigNumber.from(45000)
      };
      await contract.connect(testWallet).buy(override);

      testWallet_ContractBalance = testWallet_ContractBalance.add(override.value.div(coinPrice)); //на тестовый кошелёк покупаем токены на 45000 gwei (должно получиться 10 olx по текущему курсу). С этого кошелька продаём

      const tokensToSell = BigNumber.from(11);  //будем продавать 11 (на кошельке 10)

      await expect(contract.connect(testWallet).sell(tokensToSell)).to.be.revertedWith("You don`t have this count of tokens"); // при попытке продать 11, когда на кошельке 10, должно ревертнуть с этим текстом
    });


  });



  describe('Callvote', async () => {
    let possiblePrice : BigNumber;
    let votingEnd : BigNumber;
    let votingId : BigNumber;
    let votingSumm : BigNumber;
    let votingDuration : BigNumber;
    let votingStatus : BigNumber;

    beforeEach( async () => {

       possiblePrice = BigNumber.from(5000);
       votingDuration = BigNumber.from(3000);
       votingId = BigNumber.from(1);
       votingSumm = BigNumber.from(0);

    });

    it('Should not start voting because of low balance (<5%)', async () => {

      let override = {
        value : BigNumber.from(10000)
      };

      const possiblePrice = 5000;

      await contract.connect(testWallet).buy(override);  

      testWallet_ContractBalance = testWallet_ContractBalance.add(override.value.div(coinPrice)); //на 10000 gwei покупаем olx (2 штуки)

      await expect(contract.connect(testWallet).callvoting(possiblePrice)).to.be.revertedWith("Your balance is too low to start voiting.");  //ожидаем, что кошелёк с 2 olx на балансе не сможет запустить голосование

    });

    it('Should`t start voting when it has already started', async () => {

      let override = {
        value : BigNumber.from(225000) //4500 * 5%(1000) = 225000
      };

      await contract.connect(testWallet).buy(override);   //покупаем ровно 5 процентов от totalSupply
      await contract.connect(testWallet).callvoting(possiblePrice); //запускаем голосование первый раз
      
      await expect(contract.connect(testWallet).callvoting(possiblePrice)).to.be.revertedWith("Another voting is already started"); //запускаем сразу же второе голосование (должно не запуститься)

    });

    it('Should call voting', async () => {

      let override = {
        value : BigNumber.from(225000) //4500 * 5%(1000) = 225000
      };

      await contract.connect(testWallet).buy(override);   //покупаем ровно 5 процентов от totalSupply
      await contract.connect(testWallet).callvoting(possiblePrice); //вызываем callvote от нашего кошелька с балансом

      let blockTimestamp : BigNumber = BigNumber.from((await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp); //время последнего блока
      votingEnd = votingDuration.add(blockTimestamp); //конец это текущий блок плюс длина голосования

       expect(await contract.possiblePrice()).to.be.equal(possiblePrice); //сравниваем изменился ли possible price
       expect(await contract.votingStatus()).to.be.equal(true);           //сравниваем изменился ли статус голосования на true
       expect(await contract.votingEnd()).to.be.equal(votingEnd);         //сравниваем изменился ли voting end
       expect(await contract.votingId()).to.be.equal(votingId);           //сравниваем увеличился ли voting id
       expect(await contract.votingSumm()).to.be.equal(votingSumm);       //сравниваем обнулился ли voting Summ

    });

  });


  describe('vote', async () => {
    let possiblePrice : BigNumber;
    let votingSumm : BigNumber;
    let decision : boolean;

    beforeEach( async () => {

       possiblePrice = BigNumber.from(5000);
       votingSumm = BigNumber.from(0);
       decision = true;

    });

    it('Should`t vote when voting has been finished or never started', async () => {

      await expect(contract.connect(testWallet).vote(decision)).to.be.revertedWith("The voting has been ended or never started."); // пытаемся проголосовать, когда голосование никогда не начиналось

    });

    
    it('Should vote', async () => {

      let override = {
        value : BigNumber.from(225000) //4500 * 5%(1000) = 225000
      };

      testWallet_ContractBalance = testWallet_ContractBalance.add(override.value.div(coinPrice)); //баланс нашего кошелька (сила голоса)
      await contract.connect(testWallet).buy(override);   //покупаем ровно 5 процентов от totalSupply

      await contract.connect(testWallet).callvoting(possiblePrice); //вызываем callvote от нашего кошелька с балансом

      await contract.connect(testWallet).vote(decision); //голосуем с этого кошелька

      expect(await contract.votingSumm()).to.be.equal(testWallet_ContractBalance); //сравниваем сумму голосов в контракте с весом проголосовавшего

    });

    it('Should`t vote when this wallet already voted', async () => {
      
      let override = {
        value : BigNumber.from(225000) //4500 * 5%(1000) = 225000
      };

      testWallet_ContractBalance = testWallet_ContractBalance.add(override.value.div(coinPrice)); //баланс нашего кошелька (сила голоса)
      await contract.connect(testWallet).buy(override);   //покупаем ровно 5 процентов от totalSupply

      await contract.connect(testWallet).callvoting(possiblePrice); //вызываем callvote от нашего кошелька с балансом

      await contract.connect(testWallet).vote(decision); //голосуем с этого кошелька

      await expect(contract.connect(testWallet).vote(decision)).to.be.revertedWith("You have already voited."); //пытаемся проголосовать второй раз
    });

  });

  describe('stopvoting', async () => {
    let possiblePrice : BigNumber;
    let votingSumm : BigNumber;
    let decision : boolean;

    it('Should`t stop voting when it`s too early', async () => {

      possiblePrice = BigNumber.from(5000);
       votingSumm = BigNumber.from(0);
       decision = true;

       let override = {
        value : BigNumber.from(225000) //4500 * 5%(1000) = 225000
      };

      testWallet_ContractBalance = testWallet_ContractBalance.add(override.value.div(coinPrice)); //баланс нашего кошелька (сила голоса)
      await contract.connect(testWallet).buy(override);   //покупаем ровно 5 процентов от totalSupply

      await contract.connect(testWallet).callvoting(possiblePrice); //вызываем callvote от нашего кошелька с балансом

      await contract.connect(testWallet).vote(decision); //голосуем с этого кошелька

      await expect(contract.stopvoting()).to.be.revertedWith("The voting should stop later");

    });

    
    it('Should stop voting', async () => {
      let contractFactory : ContractFactory = await ethers.getContractFactory('erc20RedDuck');

      contract = await contractFactory.deploy(decimals, totalSupply, coinPrice, 0); //запускаем наш контракт, только voting duration = 0

      contractWallet_ProviderBalance = await ethers.provider.getBalance(contract.address);
      contractWallet_ContractBalance = totalSupply;
  
      testWallet_ContractBalance = BigNumber.from(0);

      possiblePrice = BigNumber.from(5000);
       votingSumm = BigNumber.from(0);
       decision = true;

       let override = {
        value : BigNumber.from(225000) //4500 * 5%(1000) = 225000
      };
      await contract.connect(testWallet).buy(override);   //покупаем ровно 5 процентов от totalSupply

      await contract.connect(testWallet).callvoting(possiblePrice); //вызываем callvote от нашего кошелька с балансом

      await contract.connect(testWallet).vote(decision); //голосуем с этого кошелька "за" изменение цены
      await contract.stopvoting(); //остановка голосования

      expect(await contract.currentCoinPrice()).to.be.equal(possiblePrice); //после остановки голосования должна изменится цена


    });

  });











});