// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

//contract Staking is Ownable {
contract Staking is Initializable, OwnableUpgradeable {
    IERC20 public cerToken;

    struct Stake {
        uint256 amount;
        uint256 since; // timestamp dell’inizio dello staking
        uint256 lastClaim; // timestamp dell’ultimo claim
        string telegramTag; // campo opzionale
    }

    address[] public stakers;

    mapping(address => Stake) public stakes;
    uint256 public rewardRatePerSecond = 3170979198; // 10% annuo su 1e18

    // constructor(address _cerToken) Ownable(msg.sender) {
    //     cerToken = IERC20(_cerToken);
    // }

    // --- Initializer invece del constructor ---
    function initialize(
        address _cerToken,
        uint256 _rewardRatePerSecond
    ) public initializer {
        __Ownable_init(msg.sender); // inizializza OwnableUpgradeable
        cerToken = IERC20(_cerToken);
        rewardRatePerSecond = _rewardRatePerSecond;
    }

    // --- Stake ---

    function stake(uint256 amount, string calldata _telegramTag) external {
        require(amount > 0, "Importo nullo");
        cerToken.transferFrom(msg.sender, address(this), amount);

        Stake storage s = stakes[msg.sender];
        s.amount += amount;
        s.since = block.timestamp;

        // salva il tag solo se non è vuoto
        if (bytes(_telegramTag).length > 0) {
            s.telegramTag = _telegramTag;
        }
        // se è il primo stake, inizializza lastClaim
        if (s.lastClaim == 0) {
            s.lastClaim = block.timestamp;
        }
        stakers.push(msg.sender);
    }

    // --- Calcolo reward accumulato dall’ultimo claim ---
    function calculateReward(address staker) public view returns (uint256) {
        Stake memory s = stakes[staker];
        if (s.amount == 0) return 0;

        uint256 from = s.lastClaim > 0 ? s.lastClaim : s.since;
        uint256 duration = block.timestamp - from;
        uint256 reward = (s.amount * rewardRatePerSecond * duration) / 1e18;
        return reward;
    }

    // --- Claim solo reward senza ritirare lo stake ---
    function claim() external {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "Nessuno stake");

        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "Nessun reward disponibile");

        // aggiorna timestamp ultimo claim
        s.lastClaim = block.timestamp;

        // invia CER al richiedente
        require(cerToken.transfer(msg.sender, reward), "Trasferimento fallito");
    }

    // --- Ritiro completo stake + reward ---
    function withdraw() external {
        Stake memory s = stakes[msg.sender];
        require(s.amount > 0, "Nessuno stake");

        uint256 reward = calculateReward(msg.sender);
        uint256 total = s.amount + reward;

        delete stakes[msg.sender];

        require(cerToken.transfer(msg.sender, total), "Trasferimento fallito");
    }

    // --- Solo owner: imposta reward rate ---
    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRatePerSecond = newRate;
    }

    function getStakers() external view returns (address[] memory) {
        return stakers;
    }
}
