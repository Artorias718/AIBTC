// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/// @title CER Token - ERC20 con burn personalizzato
contract CERToken is ERC20, Ownable {
    constructor() ERC20("CER Token", "CER") Ownable(msg.sender) {
        // Minta 1 milione di token iniziali all'address del deployer
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /// @notice Permette all'utente di bruciare i propri token
    /// @param amount Quantità di token da bruciare
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
