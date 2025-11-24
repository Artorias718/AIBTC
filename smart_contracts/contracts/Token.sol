// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    constructor() ERC20("AIBTC", "AI Bitcoin") Ownable(msg.sender) {
        feeCollector = msg.sender;
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    uint256 public feeBasisPoints = 100; // 100 = 1%
    uint256 public constant MAX_FEE_BPS = 300; // massimo 3%
    address public feeCollector;
    bool public feeEnabled = false;

    mapping(address => bool) public isFeeExempt;

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {

        if (
            feeEnabled &&
            feeBasisPoints > 0 &&
            !isFeeExempt[from] &&
            from != address(0) &&
            to != address(0)
        ) {
            uint256 fee = (value * feeBasisPoints) / 10000;
            uint256 amountAfterFee = value - fee;

            // invia la fee al feeCollector
            super._update(from, feeCollector, fee);
            // invia il resto al destinatario
            super._update(from, to, amountAfterFee);
        } else {
            super._update(from, to, value);
        }
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

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
