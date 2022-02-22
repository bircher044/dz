// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/interfaces/IERC2981.sol";

abstract contract ERC2981 is IERC2981 {

    struct mappedRoyalties {
        address receiver;
        uint256 percentage;
    }

    mapping(uint256 => mappedRoyalties) royalty;

    function _setRoyalties(uint256 _tokenId, address _receiver, uint256 _percentage) internal {
        royalty[_tokenId] = mappedRoyalties(_receiver, _percentage);
   }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view override(IERC2981) returns (address Receiver, uint256 royaltyAmount) {
        Receiver = royalty[_tokenId].receiver;
        royaltyAmount = _salePrice * royalty[_tokenId].percentage / 100;
    }
}