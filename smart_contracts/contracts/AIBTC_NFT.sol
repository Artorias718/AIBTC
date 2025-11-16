// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/Strings.sol";

contract AIBTC_NFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    string private baseURI_;
    IERC20 public aibtcToken; // riferimento al token ERC20
    mapping(address => bool) public hasMinted; // Traccia chi ha già mintato

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI__,
        address aibtcAddress
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        baseURI_ = baseURI__;
        aibtcToken = IERC20(aibtcAddress);
    }

    function mint(address to) external onlyOwner returns (uint256) {
        _tokenIdCounter += 1;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        return tokenId;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI_;
    }

    function setBaseURI(string memory newBase) external onlyOwner {
        baseURI_ = newBase;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        return string(abi.encodePacked(baseURI_));
    }

    function publicMint() external returns (uint256) {
        require(
            aibtcToken.balanceOf(msg.sender) >= 1 * 10 ** 18,
            "Devi possedere almeno 1 AIBTC"
        );

        require(!hasMinted[msg.sender], "Hai gia mintato un NFT");

        _tokenIdCounter += 1;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(msg.sender, tokenId);

        hasMinted[msg.sender] = true;

        return tokenId;
    }
}
