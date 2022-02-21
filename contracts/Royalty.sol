// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

abstract contract ERC2981 is IERC2981, ERC165Storage {

  bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

  mapping(uint256 => address) receiver;
  mapping(uint256 => uint256) royaltyPercentage;

  constructor() {

    _registerInterface(_INTERFACE_ID_ERC2981);

  }

  function _setReceiver(uint256 _tokenId, address _address) internal {
    receiver[_tokenId] = _address;
  }

  function _setRoyaltyPercentage(uint256 _tokenId, uint256 _royaltyPercentage) internal {
    royaltyPercentage[_tokenId] = _royaltyPercentage;
  }

  function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view override(IERC2981) returns (address Receiver, uint256 royaltyAmount) {
    Receiver = receiver[_tokenId];
    royaltyAmount = (_salePrice/100)*(royaltyPercentage[_tokenId]);
  }
}