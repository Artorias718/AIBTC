// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ICO is Initializable, OwnableUpgradeable, UUPSUpgradeable {

    IERC20 public usdt;
    IERC20 public cerToken;

    bool public saleActive;
    uint256 public price_usdt;

    uint256 public totalDepositedUSDT;
    uint256 public totalDistributedCER;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdtAddress,
        address _cerTokenAddress
    ) external initializer {
        __Ownable_init(msg.sender);

        usdt = IERC20(_usdtAddress);
        cerToken = IERC20(_cerTokenAddress);

        saleActive = true;
        price_usdt = 1; // 1 USDT iniziale
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function deposit(uint256 amount) external {
        require(saleActive, "Vendita non attiva");
        require(amount > 0, "Importo nullo");

        uint256 cerAmount = (amount * 1e12) / price_usdt;

        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "Trasferimento USDT fallito"
        );

        totalDepositedUSDT += amount;
        totalDistributedCER += cerAmount;

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
