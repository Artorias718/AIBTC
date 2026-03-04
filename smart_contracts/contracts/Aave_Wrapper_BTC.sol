pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract AaveWrapper {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IERC20 public immutable aToken;
    IPool public immutable aavePool;

    address public feeRecipient; // la lasci uguale, ma ora non hardcoded

    constructor(IERC20 _usdc, IERC20 _aToken, IPool _aavePool, address _feeRecipient) {
        require(address(_usdc) != address(0), "USDC=0");
        require(address(_aToken) != address(0), "aToken=0");
        require(address(_aavePool) != address(0), "Pool=0");
        require(_feeRecipient != address(0), "feeRecipient=0");

        usdc = _usdc;
        aToken = _aToken;
        aavePool = _aavePool;
        feeRecipient = _feeRecipient;
    }

    function deposit(uint256 amount) external {
        uint256 fee = (amount * 1) / 100; // 1%
        uint256 amountAfterFee = amount - fee;

        usdc.safeTransferFrom(msg.sender, feeRecipient, fee);
        usdc.safeTransferFrom(msg.sender, address(this), amountAfterFee);

        // identico alla tua logica (approve “semplice”)
        usdc.approve(address(aavePool), amountAfterFee);

        aavePool.supply(address(usdc), amountAfterFee, msg.sender, 0);
    }

    function withdraw(uint256 amount) external {
        require(aToken.balanceOf(msg.sender) >= amount, "Insufficient balance");

        aToken.transferFrom(msg.sender, address(this), amount);

        uint256 fee = (amount * 1) / 100;
        uint256 amountAfterFee = amount - fee;

        aavePool.withdraw(address(usdc), amount, address(this));

        usdc.safeTransfer(feeRecipient, fee);
        usdc.safeTransfer(msg.sender, amountAfterFee);
    }
}