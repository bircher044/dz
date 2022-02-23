// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Royalty.sol";
import "../modules/WhiteList.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract MorarableMarketContract {
    struct SellItem {
        uint256 tokenId;
        address tokenAddress;
        address seller;
        uint256 requiredPrice;
        bool isOnSale;
    }

    struct AuctionItem{
        uint256 tokenId;
        address tokenAddress;
        address seller;
        uint256 startPrice;
        address currentBider;
        uint256 currentBid;
        bool isOnAuction;
        bool hasBid;
        bool hasTopPrice;
        uint256 topPrice;
    }

    uint256 public priceAuctionStep;
    uint256 public marketplaceFee;

    address owner;
    address public marketStorage; //кошелёк, куда будет идти комиссия

    uint256 auctionItemsCreated;
    uint256 sellItemsCreated;

    mapping(address => uint256) public balances;
    
    mapping(uint256 => SellItem) public itemsForSale;
    mapping(uint256 => AuctionItem) public itemsForAuction;

    mapping(address => mapping (uint256 => bool)) activeItems;

    event itemSellAdded(uint256 tokenId, address tokenAddress, uint256 requiredPrice, address seller);
    event itemSellSold(uint256 id, address buyer, uint256 askingPrice);
    event itemSellRemoved(uint256 tokenId, address tokenAddress, address seller);

    event itemAuctionAdded(uint256 tokenId, address tokenAddress, uint256 startPrice, address seller);
    event itemAuctionBid(uint256 tokenId, address tokenAddress, uint256 bidValue, address buyer);
    event itemAuctionSold(uint256 tokenId, address tokenAddress, uint256 finalPrice, address seller, address buyer);
    event itemAuctionRemoved(uint256 tokenId, address tokenAddress, address seller);

    event balanceWithdraw(address withdrawer, uint256 transactionValue, uint256 balanceAvailable);

    constructor(uint256 _priceAuctionStep, uint256 _marketplaceFee, address _marketStorage){
        priceAuctionStep = _priceAuctionStep;
        marketplaceFee = _marketplaceFee;
        marketStorage = _marketStorage;
        owner = address(this);
    }

    modifier OnlyContractOwner(){
        require(msg.sender == owner, "You are not owner of the contract.");
        _;
    }

    modifier OnlyItemOwner(address tokenAddress, uint256 tokenId){
        IERC721 tokenContract = IERC721(tokenAddress);
        require(tokenContract.ownerOf(tokenId) == msg.sender);
        _;
    }

    modifier HasTransferApproval(address tokenAddress, uint256 tokenId){
        IERC721 tokenContract = IERC721(tokenAddress);
        require(tokenContract.getApproved(tokenId) == address(this));
        _;
    }

    modifier NotOnSale(address tokenAddress, uint256 tokenId){
        require(!activeItems[tokenAddress][tokenId], "Item is not on market.");
        _;
    }

    modifier OnSellMarket(uint256 id){
        require(itemsForSale[id].isOnSale, "Not on sale");
        _;
    }

    modifier OnAuctionMarket(uint256 id){
        require(itemsForAuction[id].isOnAuction, "Not on auction");
        _;
    }

    function changeAddressStorage(address _newStorage) public OnlyContractOwner {
        marketStorage = payable(_newStorage);
    }

    function addItemToMarket(
    uint256 tokenId, 
    address tokenAddress, 
    uint256 requiredPrice
    )
    NotOnSale(tokenAddress,tokenId)
    OnlyItemOwner(tokenAddress,tokenId) 
    HasTransferApproval(tokenAddress,tokenId)
    external returns (uint256){
        activeItems[tokenAddress][tokenId] = true;
        sellItemsCreated++;

        itemsForSale[sellItemsCreated] = SellItem(tokenId, tokenAddress, msg.sender, requiredPrice, true);

        emit itemSellAdded(tokenId, tokenAddress, requiredPrice, msg.sender);
        return sellItemsCreated;
    }

    function buyItem(
    uint256 id
    ) 
    payable external 
    OnSellMarket(id) 
    HasTransferApproval(itemsForSale[id].tokenAddress, id){
        require(msg.value >= itemsForSale[id].requiredPrice, "Not enough funds sent.");
        require(msg.sender != itemsForSale[id].seller, "You can`t buy your own token!");

        itemsForSale[id].isOnSale = false;
        activeItems[itemsForSale[id].tokenAddress][itemsForSale[id].tokenId] = false;
        
        payFees(id, itemsForSale[id].seller);
        IERC721(itemsForSale[id].tokenAddress).safeTransferFrom(itemsForSale[id].seller, msg.sender, itemsForSale[id].tokenId);


        emit itemSellSold(id, msg.sender, itemsForSale[id].requiredPrice);
    }

    function removeItemFromMarket(
    uint256 id
    ) 
    OnSellMarket(id) 
    OnlyItemOwner(itemsForSale[id].tokenAddress, id) 
    external returns (bool){
        itemsForSale[id].isOnSale = false;

        activeItems[itemsForAuction[id].tokenAddress][itemsForAuction[id].tokenId] = false;

        emit itemSellRemoved(id, itemsForSale[id].tokenAddress, itemsForSale[id].seller);
        return true;
    }

    function addItemToAuction(
    uint256 tokenId, 
    address tokenAddress, 
    uint256 startPrice,
    bool hasTopPrice,
    uint256 topPrice
    ) 
    OnlyItemOwner(tokenAddress, tokenId) 
    HasTransferApproval(tokenAddress, tokenId) 
    NotOnSale(tokenAddress, tokenId)
    external returns (uint256){
        activeItems[tokenAddress][tokenId] = true;
        auctionItemsCreated++;
        itemsForAuction[auctionItemsCreated] = AuctionItem(tokenId, tokenAddress, msg.sender, startPrice, address(0), 0, true, false, hasTopPrice, topPrice);

        emit itemAuctionAdded(tokenId, tokenAddress, startPrice, msg.sender);
        return auctionItemsCreated;
    }

    function makeBid(
    uint256 id
    ) 
    OnAuctionMarket(id) 
    HasTransferApproval(itemsForAuction[id].tokenAddress, itemsForAuction[id].tokenId) 
    external payable returns (bool){
        require(msg.value >= Math.max(itemsForAuction[id].currentBid + priceAuctionStep, itemsForAuction[id].startPrice), "Your bid is too low");

        if(itemsForAuction[id].hasBid)
            payable(itemsForAuction[id].currentBider).transfer(itemsForAuction[id].currentBid);

        itemsForAuction[id].currentBid = msg.value;
        itemsForAuction[id].currentBider = payable(msg.sender);
        itemsForAuction[id].hasBid = true;
        
        emit itemAuctionBid(itemsForAuction[id].tokenId, itemsForAuction[id].tokenAddress, itemsForAuction[id].currentBid, itemsForAuction[id].currentBider);
        return true;
    }

    function stopAuction(
    uint256 id
    )
    OnAuctionMarket(id)
    OnlyItemOwner(itemsForSale[id].tokenAddress, itemsForSale[id].tokenId)
    HasTransferApproval(itemsForAuction[id].tokenAddress, itemsForAuction[id].tokenId)
    public returns (bool){
        if(itemsForAuction[id].hasBid){
            payFees(id, itemsForAuction[id].seller);
            IERC721(itemsForAuction[id].tokenAddress).safeTransferFrom(itemsForAuction[id].seller, itemsForAuction[id].currentBider, itemsForAuction[id].tokenId);

            emit itemAuctionSold(itemsForAuction[id].tokenId, itemsForAuction[id].tokenAddress, itemsForAuction[id].currentBid, itemsForAuction[id].seller, itemsForAuction[id].currentBider);
        }
        else
            emit itemAuctionRemoved(itemsForAuction[id].tokenId, itemsForAuction[id].tokenAddress, itemsForAuction[id].seller);

        activeItems[itemsForAuction[id].tokenAddress][itemsForAuction[id].tokenId] = false;
        
        return true;
    }

    function payFees(
        uint256 id,
        address seller
    )
    internal{
        address tokenOwner;
        uint256 royaltyValue;
        uint256 whitelistValue;

        //ERC2981 royalty = new ERC2981();
      //  (tokenOwner, royaltyValue) = Royalty.royaltyInfo(itemsForSale[id].tokenId, msg.value);

        //WhiteList whitelist = new WhiteList(2);
      //  whitelistValue = whitelist.whitelistFee(tokenOwner, msg.value);

        balances[tokenOwner] += royaltyValue + whitelistValue;
        balances[marketStorage] += msg.value * marketplaceFee / 100;
        balances[seller] += msg.value - royaltyValue - whitelistValue - msg.value * marketplaceFee / 100;
    }

    function withdraw(
        uint256 value
    ) 
    public returns (bool){
        require(balances[msg.sender] >= value, "Your balance is 0.");

        balances[msg.sender] -= value;
        payable(msg.sender).transfer(value);

        emit balanceWithdraw(msg.sender, value, balances[msg.sender]);
        return true;
    }


}