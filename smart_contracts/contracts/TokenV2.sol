// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    constructor() ERC20("AIBTC", "AI Bitcoin") Ownable(msg.sender) {
        feeCollector = msg.sender;
        isFeeExempt[msg.sender] = true;
        isTradingExempt[msg.sender] = true;

        _mint(msg.sender, 21_000_000 * 10 ** decimals());
    }

    // ------------------------------------
    //               FEES
    // ------------------------------------
    uint256 public feeBasisPoints = 100; // 1%
    uint256 public constant MAX_FEE_BPS = 300; // max 3%
    address public feeCollector;
    bool public feeEnabled = false;

    mapping(address => bool) public isFeeExempt;

    // ------------------------------------
    //           TRADING LOCK
    // ------------------------------------
    bool public tradingEnabled = false;
    bool public tradingPermanentlyEnabled = false;

    mapping(address => bool) public isTradingExempt;

    // ------------------------------------
    //           TRANSFER LOGIC
    // ------------------------------------
    function _update(address from, address to, uint256 value) internal override {

        if (from != address(0) && to != address(0)) {
            require(
                tradingEnabled || isTradingExempt[from],
                "Trading not enabled"
            );
        }

        if (
            feeEnabled &&
            feeBasisPoints > 0 &&
            !isFeeExempt[from] &&
            from != address(0) &&
            to != address(0)
        ) {
            uint256 fee = (value * feeBasisPoints) / 10000;
            uint256 amountAfterFee = value - fee;

            super._update(from, feeCollector, fee);
            super._update(from, to, amountAfterFee);
        } else {
            super._update(from, to, value);
        }
    }

    // ------------------------------------
    //            OWNER
    // ------------------------------------

    function enableTrading() external onlyOwner {
        require(!tradingPermanentlyEnabled, "Trading already permanently enabled");

        tradingEnabled = true;
        tradingPermanentlyEnabled = true;
    }

    function setTradingExempt(address account, bool exempt) external onlyOwner {
        isTradingExempt[account] = exempt;
    }

    function setFee(uint256 _bps) external onlyOwner {
        require(_bps <= MAX_FEE_BPS, "Fee too high");
        feeBasisPoints = _bps;
    }

    function setFeeCollector(address _collector) external onlyOwner {
        require(_collector != address(0), "Invalid address");
        feeCollector = _collector;
    }

    function setFeeExempt(address account, bool exempt) external onlyOwner {
        isFeeExempt[account] = exempt;
    }

    function setFeeEnabled(bool enabled) external onlyOwner {
        feeEnabled = enabled;
    }

    // ------------------------------------
    //       MINT & BURN
    // ------------------------------------

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
