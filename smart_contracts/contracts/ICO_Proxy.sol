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

    event Deposited(address indexed user, uint256 usdtAmount, uint256 cerAmount);
    event PriceUpdated(uint256 newPrice);
    event SaleStarted();
    event SaleStopped();

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
        price_usdt = 10; // Initial price
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function deposit(uint256 amount) external {
        require(saleActive, "Sale not active");
        require(amount > 0, "Amount is null");

        uint256 cerAmount = (amount * 1e14) / price_usdt;

        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "AIBTC transfer failed"
        );

        totalDepositedUSDT += amount;
        totalDistributedCER += cerAmount;

        require(
            cerToken.transfer(msg.sender, cerAmount),
            "AIBTC transfer failed"
        );
        emit Deposited(msg.sender, amount, cerAmount);
    }

    function withdrawUSDC(uint256 amount) external onlyOwner {
        require(amount > 0, "Importo nullo");
        require(usdt.transfer(msg.sender, amount * 1e6), "USDC Withdraw failed");
    }

    function withdrawCER(uint256 amount) external onlyOwner {
        require(amount > 0, "Importo nullo");
        require(cerToken.transfer(msg.sender, amount * 1e18), "AIBTC Withdraw failed");
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Invalid price");
        price_usdt = newPrice;
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
