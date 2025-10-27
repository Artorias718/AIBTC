// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/// @title CERICO - Scambia USDT per CER (1:1)
contract CERICO is Ownable {
    IERC20 public usdt;
    IERC20 public cerToken;

    constructor(
        address _usdtAddress,
        address _cerTokenAddress
    ) Ownable(msg.sender) {
        usdt = IERC20(_usdtAddress);
        cerToken = IERC20(_cerTokenAddress);
    }

    /// @notice Deposita USDT e ricevi CER in cambio 1:1
    /// @param amount Quantità di USDT da depositare
    function deposit(uint256 amount) external {
        require(amount > 0, "Importo nullo");

        // Riceve USDT dal mittente
        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "Trasferimento USDT fallito"
        );

        uint256 rate;

        if (amount <= 500 * 10 ** 6) {
            rate = 100; // 1.00
        } else if (amount <= 1000 * 10 ** 6) {
            rate = 125; // 1.25
        } else {
            rate = 166; // 1.66
        }

        // Calcola CER da inviare normalizzando i decimali
        uint256 cerAmount = (amount * 10 ** 12 * rate) / 100; // USDT 6 decimali → CER 18 decimali

        // Invia CER all'utente
        require(
            cerToken.transfer(msg.sender, cerAmount),
            "Trasferimento CER fallito"
        );
    }

    /// @notice Preleva USDT dal contratto (solo owner)
    function withdrawUSDT(uint256 amount) external onlyOwner {
        require(amount > 0, "Importo nullo");
        require(usdt.transfer(msg.sender, amount), "Prelievo USDT fallito");
    }

    /// @notice Preleva CER dal contratto (solo owner)
    function withdrawCER(uint256 amount) external onlyOwner {
        require(amount > 0, "Importo nullo");
        require(cerToken.transfer(msg.sender, amount), "Prelievo CER fallito");
    }
}
