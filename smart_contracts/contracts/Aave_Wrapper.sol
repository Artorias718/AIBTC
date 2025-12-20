pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset,uint256 amount,address to) external returns (uint256);
}

contract AaveWrapper {
    using SafeERC20 for IERC20;

    IERC20 public usdc;
    IERC20 aToken = IERC20(0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC);
    IPool public aavePool;
    address public feeRecipient = 0x709c729ad1Bf900dfa503a9E510175FD65135cDB;

    constructor(IERC20 _usdc, IPool _aavePool) {
        usdc = _usdc;
        aavePool = _aavePool;
    }

    function deposit(uint256 amount) external {

        uint256 fee = (amount * 1) / 100; // 1%
        uint256 amountAfterFee = amount - fee;

        // Transfer fee
        usdc.safeTransferFrom(msg.sender, feeRecipient, fee);

        // Transfer remaining USDC to this contract
        usdc.safeTransferFrom(msg.sender, address(this), amountAfterFee);

        // // Approve Aave Pool
        usdc.approve(address(aavePool), amountAfterFee);

        // // Deposit on Aave for msg.sender
        aavePool.supply(address(usdc), amountAfterFee, msg.sender, 0);
    }

    function withdraw(uint256 amount) external {
    
        require(aToken.balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        aToken.transferFrom(msg.sender, address(this), amount);

        uint256 fee = (amount * 1) / 100;
        uint256 amountAfterFee = amount - fee;

        // Preleva i token da Aave Pool verso il wrapper
        aavePool.withdraw(address(usdc), amount, address(this));

        // Trasferisci fee e resto
        usdc.safeTransfer(feeRecipient, fee);
        usdc.safeTransfer(msg.sender, amountAfterFee);
    }

}
