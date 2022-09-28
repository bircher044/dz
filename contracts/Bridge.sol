// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Bridge{
    IERC20 _token;
    address _keeper;
    constructor(IERC20 token, address keeper){
        _token = token;
        _keeper = keeper;
    }
    modifier OnlyBridgeKeeper(){
        require(msg.sender == _keeper, "Bridge: only keeper");
        _;
    }
    event Send(uint256 amount, address who);
    event Keep(uint256 amount, address who);

    function send(uint256 amount) external{
        _token.transferFrom(msg.sender, address(this), amount);
        emit Send(amount, msg.sender);
    }

    function keep(uint256 amount, address who) OnlyBridgeKeeper external{
        _token.transfer(who, amount);
        emit Keep(amount, who);
    }
}