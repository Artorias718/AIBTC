// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title Staking (budgeted annual rewards, dynamic APY) + yearly periods with restart
 * @notice Distributes a fixed annual reward budget proportionally to stakers.
 * - Rewards accrue ONLY until `rewardsEnd` (1-year window).
 * - After `rewardsEnd`, rewards stop increasing (APY returns 0).
 * - Owner can "refill" tokens and call `restartRewards(newAnnualBudget)` to start a new 365-day period.
 *
 * Notes:
 * - Contract must be funded with reward tokens by owner (transfer tokens to contract address).
 * - totalStakedAmount is maintained on every stake/withdraw.
 */
contract Staking is Initializable, OwnableUpgradeable, UUPSUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public cerToken;

    struct Stake {
        uint256 amount;      // tokens staked by user
        uint256 since;       // first stake timestamp
        uint256 lastClaim;   // last time rewards were accrued
        uint256 unclaimed;   // accrued rewards not yet claimed
    }

    // stakers list (used for reading / external views). Note: array may grow.
    address[] public stakers;

    mapping(address => Stake) public stakes;
    mapping(address => bool) internal _isStaker;

    // total tokens currently staked
    uint256 public totalStakedAmount;

    // reward budget and derived rate
    uint256 public annualRewardBudget;          // e.g. 250_000 * 1e18
    uint256 public rewardRatePerSecondGlobal;   // = annualRewardBudget / 365 days

    // rewards stop accruing after this timestamp (period end)
    uint256 public rewardsEnd;

    // events
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event AnnualBudgetUpdated(uint256 newBudget);
    event RewardsRestarted(uint256 newBudget, uint256 newRewardsEnd);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _cerToken, uint256 _annualRewardBudget) external initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();

        cerToken = IERC20(_cerToken);
        _setAnnualBudget(_annualRewardBudget);

        // start first 1-year reward period
        rewardsEnd = block.timestamp + 365 days;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ----------------------------- owner utilities -----------------------------

    /// @notice Set annual reward budget (in token smallest units). Updates per-second rate.
    function setAnnualRewardBudget(uint256 _annualRewardBudget) external onlyOwner {
        _setAnnualBudget(_annualRewardBudget);
        emit AnnualBudgetUpdated(_annualRewardBudget);
    }

    function _setAnnualBudget(uint256 _annualRewardBudget) internal {
        annualRewardBudget = _annualRewardBudget;
        // integer division: small remainder ignored
        rewardRatePerSecondGlobal = _annualRewardBudget / 365 days;
    }

    /**
     * @notice Restart rewards for a new 365-day period.
     * Requirements:
     * - previous period must be finished (block.timestamp >= rewardsEnd)
     * - newAnnualBudget must be > 0
     *
     * IMPORTANT:
     * - Before calling, owner should fund the contract with enough reward tokens
     *   (transfer cerToken to this contract address).
     */
    function restartRewards(uint256 newAnnualBudget) external onlyOwner {
        require(block.timestamp >= rewardsEnd, "Previous period still active");
        require(newAnnualBudget > 0, "Budget must be > 0");

        _setAnnualBudget(newAnnualBudget);
        rewardsEnd = block.timestamp + 365 days;

        emit RewardsRestarted(newAnnualBudget, rewardsEnd);
    }

    /// @notice Owner can recover accidentally sent tokens that are not cerToken.
    function recoverExcessTokens(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(cerToken), "use dedicated flow for cerToken");
        IERC20(token).safeTransfer(to, amount);
    }

    // ----------------------------- stake logic -----------------------------

    function stake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount is zero");
        Stake storage s = stakes[msg.sender];

        // transfer tokens first
        cerToken.safeTransferFrom(msg.sender, address(this), amount);

        // if user already has stake, snapshot pending reward into unclaimed
        if (s.amount > 0) {
            uint256 pending = _calculateRewardInternal(s);
            if (pending > 0) {
                s.unclaimed += pending;
            }
            s.lastClaim = block.timestamp;
        } else {
            // first time staker
            s.since = block.timestamp;
            s.lastClaim = block.timestamp;

            // record in stakers array
            if (!_isStaker[msg.sender]) {
                stakers.push(msg.sender);
                _isStaker[msg.sender] = true;
            }
        }

        s.amount += amount;
        totalStakedAmount += amount;

        emit Staked(msg.sender, amount);
    }

    // ----------------------------- reward calculation -----------------------------

    /// @notice Public view wrapper to get current claimable reward for a user (includes unclaimed snapshot)
    function calculateReward(address staker) public view returns (uint256) {
        Stake memory s = stakes[staker];
        if (s.amount == 0 && s.unclaimed == 0) return 0;

        uint256 pending = _calculateRewardInternalView(s);
        return s.unclaimed + pending;
    }

    /// @dev internal reward calc (storage -> uses current msg.sender stake passed by reference)
    function _calculateRewardInternal(Stake storage s) internal view returns (uint256) {
        if (s.amount == 0) return 0;
        if (totalStakedAmount == 0) return 0;

        uint256 from = s.lastClaim > 0 ? s.lastClaim : s.since;

        // cap "to" at rewardsEnd so rewards stop accruing after period end
        uint256 to = block.timestamp;
        if (to > rewardsEnd) to = rewardsEnd;

        if (to <= from) return 0;

        uint256 duration = to - from; // seconds

        // userShare scaled by 1e18
        uint256 userShare = (s.amount * 1e18) / totalStakedAmount;

        // reward = rewardPerSecond * duration * userShare / 1e18
        uint256 reward = (rewardRatePerSecondGlobal * duration * userShare) / 1e18;
        return reward;
    }

    /// @dev view version for calculateReward (works on memory snapshot)
    function _calculateRewardInternalView(Stake memory s) internal view returns (uint256) {
        if (s.amount == 0) return 0;
        if (totalStakedAmount == 0) return 0;

        uint256 from = s.lastClaim > 0 ? s.lastClaim : s.since;

        uint256 to = block.timestamp;
        if (to > rewardsEnd) to = rewardsEnd;

        if (to <= from) return 0;

        uint256 duration = to - from;

        uint256 userShare = (s.amount * 1e18) / totalStakedAmount;
        uint256 reward = (rewardRatePerSecondGlobal * duration * userShare) / 1e18;
        return reward;
    }

    // ----------------------------- claim & withdraw -----------------------------

    function claim() external whenNotPaused {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0 || s.unclaimed > 0, "No stake or reward");

        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No reward available");

        // check contract has enough free tokens to pay the reward
        uint256 contractBalance_ = cerToken.balanceOf(address(this));
        // The contract holds both staked tokens and reward reserve.
        require(contractBalance_ >= totalStakedAmount + reward, "not enough liquidity for rewards");

        // reset accounting
        s.unclaimed = 0;
        s.lastClaim = block.timestamp;

        cerToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    function withdraw() external whenNotPaused {
        Stake memory s = stakes[msg.sender];
        require(s.amount > 0, "No stake");

        uint256 reward = calculateReward(msg.sender);
        uint256 principal = s.amount;
        uint256 total = principal + reward;

        // update global state
        totalStakedAmount -= principal;

        // delete stake
        delete stakes[msg.sender];
        _isStaker[msg.sender] = false; // note: stakers array still contains the address

        // safety: check contract has enough tokens to pay principal + reward
        uint256 contractBalance_ = cerToken.balanceOf(address(this));
        require(contractBalance_ >= total, "Insufficient funds to pay");

        cerToken.safeTransfer(msg.sender, total);
        emit Withdrawn(msg.sender, total);
    }

    function withdrawPartial(uint256 amount) external whenNotPaused {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "No stake");
        require(amount > 0 && amount <= s.amount, "Invalid amount");

        // snapshot reward up to now (includes unclaimed)
        uint256 reward = calculateReward(msg.sender);

        // reduce stake and total
        s.amount -= amount;
        totalStakedAmount -= amount;

        // reset reward accounting
        s.unclaimed = 0;
        s.lastClaim = block.timestamp;

        uint256 transferAmount = amount + reward;

        uint256 contractBalance_ = cerToken.balanceOf(address(this));
        require(contractBalance_ >= transferAmount, "Insufficient funds to pay");

        cerToken.safeTransfer(msg.sender, transferAmount);
        emit Withdrawn(msg.sender, transferAmount);
    }

    // ----------------------------- views -----------------------------

    /// @notice Returns whether rewards are currently accruing.
    function rewardsActive() external view returns (bool) {
        return block.timestamp < rewardsEnd;
    }

    /// @notice Current APY expressed in 1e18 precision.
    /// After rewardsEnd, returns 0 (since rewards no longer accrue).
    function currentAPY() external view returns (uint256) {
        if (block.timestamp >= rewardsEnd) return 0;
        if (totalStakedAmount == 0) return 0;
        return (annualRewardBudget * 1e18) / totalStakedAmount;
    }

    /// @notice Current daily reward rate per token staked (for frontend helper)
    /// After rewardsEnd, returns 0.
    function dailyRatePerToken() external view returns (uint256) {
        if (block.timestamp >= rewardsEnd) return 0;
        if (totalStakedAmount == 0) return 0;
        uint256 dailyReward = annualRewardBudget / 365;
        return (dailyReward * 1e18) / totalStakedAmount; // scaled
    }

    function getStakers() external view returns (address[] memory) {
        return stakers;
    }

    /// @notice Convenience balance view
    function contractBalance() external view returns (uint256) {
        return cerToken.balanceOf(address(this));
    }

    // ----------------------------- pause -----------------------------

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}