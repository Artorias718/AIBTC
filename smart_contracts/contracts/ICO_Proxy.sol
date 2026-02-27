// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ICO is Initializable, OwnableUpgradeable, UUPSUpgradeable {

    IERC20 public usdc;
    IERC20 public aibtc;

    bool public saleActive;
    uint256 public price_usdc;

    uint256 public totalDepositedusdc;
    uint256 public totalDistributedCER;

    event Deposited(address indexed user, uint256 usdcAmount, uint256 cerAmount);
    event PriceUpdated(uint256 newPrice);
    event SaleStarted();
    event SaleStopped();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdcAddress,
        address _aibtcAddress
    ) external initializer {
        __Ownable_init(msg.sender);

        usdc = IERC20(_usdcAddress);
        aibtc = IERC20(_aibtcAddress);

        saleActive = true;
        price_usdc = 10; // Initial price
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function deposit(uint256 amount) external {
        require(saleActive, "Sale not active");
        require(amount > 0, "Amount is null");

        uint256 cerAmount = (amount * 1e14) / price_usdc;

        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "AIBTC transfer failed"
        );

        totalDepositedusdc += amount;
        totalDistributedCER += cerAmount;

        require(
            aibtc.transfer(msg.sender, cerAmount),
            "AIBTC transfer failed"
        );
        emit Deposited(msg.sender, amount, cerAmount);
    }

    function withdrawUSDC(uint256 amount) external onlyOwner {
        require(amount > 0, "Importo nullo");
        require(usdc.transfer(msg.sender, amount * 1e6), "USDC Withdraw failed");
    }

    function withdrawCER(uint256 amount) external onlyOwner {
        require(amount > 0, "Importo nullo");
        require(aibtc.transfer(msg.sender, amount * 1e18), "AIBTC Withdraw failed");
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Invalid price");
        price_usdc = newPrice;
        emit PriceUpdated(newPrice);
    }

    function startSale() external onlyOwner {
        saleActive = true;
        emit SaleStarted();
    }

    function stopSale() external onlyOwner {
        saleActive = false;
        emit SaleStopped();
    }
}
