// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Staking is Initializable, OwnableUpgradeable, UUPSUpgradeable {

    IERC20 public cerToken;

    struct Stake {
        uint256 amount;
        uint256 since;
        uint256 lastClaim;
        string telegramTag;
    }

    address[] public stakers;

    mapping(address => Stake) public stakes;
    uint256 public rewardRatePerSecond;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _cerToken) external initializer {
        __Ownable_init(msg.sender);

        cerToken = IERC20(_cerToken);
        rewardRatePerSecond = 3170979198; // 10% annuo su 1e18
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // --- Stake ---
    function stake(uint256 amount, string calldata _telegramTag) external {
        require(amount > 0, "Importo nullo");
        cerToken.transferFrom(msg.sender, address(this), amount);

        Stake storage s = stakes[msg.sender];

        // Se è il primo stake, aggiungi allo storico
        if (s.amount == 0) {
            stakers.push(msg.sender);
            s.since = block.timestamp;
            s.lastClaim = block.timestamp;
        }

        s.amount += amount;

        if (bytes(_telegramTag).length > 0) {
            s.telegramTag = _telegramTag;
        }
    }

    // --- Calcolo reward ---
    function calculateReward(address staker) public view returns (uint256) {
        Stake memory s = stakes[staker];
        if (s.amount == 0) return 0;

        uint256 from = s.lastClaim > 0 ? s.lastClaim : s.since;
        uint256 duration = block.timestamp - from;

        return (s.amount * rewardRatePerSecond * duration) / 1e18;
    }

    // --- Claim reward ---
    function claim() external {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "Nessuno stake");

        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "Nessun reward disponibile");

        s.lastClaim = block.timestamp;

        require(cerToken.transfer(msg.sender, reward), "Trasferimento fallito");
    }

    // --- Withdraw completo ---
    function withdraw() external {
        Stake memory s = stakes[msg.sender];
        require(s.amount > 0, "Nessuno stake");

        uint256 reward = calculateReward(msg.sender);
        uint256 total = s.amount + reward;

        delete stakes[msg.sender];

        require(cerToken.transfer(msg.sender, total), "Trasferimento fallito");
    }

    // --- Solo owner ---
    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRatePerSecond = newRate;
    }

    function getStakers() external view returns (address[] memory) {
        return stakers;
    }
}
