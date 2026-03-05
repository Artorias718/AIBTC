pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract AaveWrapper {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    IERC20 public immutable aToken;
    IPool public immutable aavePool;

    address public feeRecipient; 

    constructor(IERC20 _token, IERC20 _aToken, IPool _aavePool, address _feeRecipient) {
        require(address(_token) != address(0), "token=0");
        require(address(_aToken) != address(0), "aToken=0");
        require(address(_aavePool) != address(0), "Pool=0");
        require(_feeRecipient != address(0), "feeRecipient=0");

        token = _token;
        aToken = _aToken;
        aavePool = _aavePool;
        feeRecipient = _feeRecipient;
    }

    function deposit(uint256 amount) external {
        uint256 fee = (amount * 1) / 200; // 100=1%, 200=0.5%
        uint256 amountAfterFee = amount - fee;

        token.safeTransferFrom(msg.sender, feeRecipient, fee);
        token.safeTransferFrom(msg.sender, address(this), amountAfterFee);

        // identico alla tua logica (approve “semplice”)
        token.approve(address(aavePool), amountAfterFee);

        aavePool.supply(address(token), amountAfterFee, msg.sender, 0);
    }

    function withdraw(uint256 amount) external {
        require(aToken.balanceOf(msg.sender) >= amount, "Insufficient balance");

        aToken.transferFrom(msg.sender, address(this), amount);

        uint256 fee = (amount * 1) / 200;
        uint256 amountAfterFee = amount - fee;

        aavePool.withdraw(address(token), amount, address(this));

        token.safeTransfer(feeRecipient, fee);
        token.safeTransfer(msg.sender, amountAfterFee);
    }
}