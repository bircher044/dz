
provider=new ethers.providers.Web3Provider(window.ethereum);
provider.send("eth_requestAccounts", []);
signer=provider.getSigner();

contractAddress="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
contractAbi=[
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "victimAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "inputs": [],
      "name": "attack",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "victim",
      "outputs": [
        {
          "internalType": "contract erc20RedDuck",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

contract=new ethers.Contract(contractAddress, contractAbi, signer);

async function hack(){
  await contract.attack({value : ethers.BigNumber.from("1000000000000000000")});
}

async function GetBalance(){
    document.getElementById("balance").value =  (await contract.getBalance()).toString();
}


