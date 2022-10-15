// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/interfaces/IERC2981.sol";

abstract contract WhiteList is IERC2981 {

    uint8 whiteListPercentage;

    address owner;

    mapping(address => bool) whitelistedAddresses;

    constructor(uint8 _whiteListPercentage){
        owner = address(this);
        whiteListPercentage = _whiteListPercentage;
    }

    modifier OnlyContractOwner(){
        require(msg.sender == owner, "You are not owner of the contract.");
        _;
    }

    function changeWhitelistStatus(address _addressToWhitelist, bool status) public OnlyContractOwner {
        whitelistedAddresses[_addressToWhitelist] = status;
    }

    function whitelistFee(address member, uint256 sale_price) external view returns (uint256) {
        return whitelistedAddresses[member] ? sale_price * whiteListPercentage / 100 : 0;
    }
}