// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract ICO is Ownable {
    IERC20 public usdt;
    IERC20 public cerToken;
    bool public saleActive = true;
    uint256 public price_usdt = 1; 

    uint256 public totalDepositedUSDT;
    uint256 public totalDistributedCER;

    constructor(
        address _usdtAddress,
        address _cerTokenAddress
    ) Ownable(msg.sender) {
        usdt = IERC20(_usdtAddress);
        cerToken = IERC20(_cerTokenAddress);
    }

    function deposit(uint256 amount) external {
        require(saleActive, "Vendita non attiva");
        require(amount > 0, "Importo nullo");

        uint256 cerAmount = (amount * 1e12) / price_usdt;

        // Riceve USDT dal mittente
        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "Trasferimento USDT fallito"
        );

        totalDepositedUSDT += amount;
        totalDistributedCER += cerAmount;

        // Invia CER all'utente
        require(
            cerToken.transfer(msg.sender, cerAmount),
            "Trasferimento CER fallito"
        );
    }

    function withdrawUSDT(uint256 amount) external onlyOwner {
        require(amount > 0, "Importo nullo");
        require(usdt.transfer(msg.sender, amount * 1e6), "Prelievo USDT fallito");
    }

    function withdrawCER(uint256 amount) external onlyOwner {
        require(amount > 0, "Importo nullo");
        require(cerToken.transfer(msg.sender, amount * 1e18), "Prelievo CER fallito");
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Prezzo non valido");
        price_usdt = newPrice;
    }

    function startSale() external onlyOwner {
        saleActive = true;
    }

    function stopSale() external onlyOwner {
        saleActive = false;
    }
}
