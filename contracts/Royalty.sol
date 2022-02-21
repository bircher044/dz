// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

abstract contract ERC2981 is IERC2981, ERC165Storage {

    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    uint8 royaltyPercentage;

    address owner;

    mapping(uint256 => address) receiver;

    constructor(uint8 _royaltyPercentage) {
        royaltyPercentage = _royaltyPercentage;
        owner = address(this);

        _registerInterface(_INTERFACE_ID_ERC2981);
    }

    modifier OnlyContractOwner(){
      require(msg.sender == owner, "You are not owner of the contract.");
    _;
    }

    function setReceiver(uint256 _tokenId, address _address) OnlyContractOwner public {
        receiver[_tokenId] = _address;
    }

    function setRoyaltyPercentage(uint8 _royaltyPercentage) OnlyContractOwner public {
        royaltyPercentage = _royaltyPercentage;
    }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view override(IERC2981) returns (address Receiver, uint256 royaltyAmount) {
        Receiver = receiver[_tokenId];
        royaltyAmount = (_salePrice * royaltyPercentage) / 100;
    }
}