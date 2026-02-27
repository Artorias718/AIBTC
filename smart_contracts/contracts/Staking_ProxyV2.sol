// SPDX-License-Identifier: MIT
 pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";


/**
 * @title Staking (budgeted annual rewards, dynamic APY)
 * @notice Distributes a fixed annual reward budget proportionally to stakers.
 * - Annual budget (e.g. 250k tokens/year) is set in token smallest units (wei-like)
 * - Rewards per second = annualBudget / 365 days
 * - Each staker receives (stake / totalStaked) * rewardsPerSecond for the time they were staked
 *
 * Notes:
 * - Contract must be funded with reward tokens by owner (transfer tokens to contract address).
 * - To avoid expensive loops, totalStakedAmount is maintained on every stake/withdraw.
 * - When a user increases stake we first snapshot accrued reward into `unclaimed` to avoid losing them.
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

    // stakers list (used for reading / external views). Note: array may grow; you may want an alternative for large-scale.
    address[] public stakers;

    mapping(address => Stake) public stakes;
    mapping(address => bool) internal _isStaker;

    // total tokens currently staked (keeps gas low vs iterating stakers)
    uint256 public totalStakedAmount;

    // reward budget and derived rate
    uint256 public annualRewardBudget;          // e.g. 250_000 * 1e18
    uint256 public rewardRatePerSecondGlobal;   // = annualRewardBudget / 365 days

    // events
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event AnnualBudgetUpdated(uint256 newBudget);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _cerToken, uint256 _annualRewardBudget) external initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        cerToken = IERC20(_cerToken);
        _setAnnualBudget(_annualRewardBudget);
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
        // use 365 days as year length. integer division: fine, small remainder ignored.
        rewardRatePerSecondGlobal = _annualRewardBudget / 365 days;
    }

    /// @notice Owner can recover accidentally sent tokens that are not part of staked amounts or rewards budget.
    /// Use with care. This function does not withdraw tokens that are currently staked.
    function recoverExcessTokens(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(cerToken), "use dedicated flow for cerToken");
        IERC20(token).safeTransfer(to, amount);
    }

    // ----------------------------- stake logic -----------------------------

    function stake(uint256 amount) external whenNotPaused{
        require(amount > 0, "Importo nullo");
        Stake storage s = stakes[msg.sender];

        // transfer tokens first
        cerToken.safeTransferFrom(msg.sender, address(this), amount);

        // if user already has stake, snapshot pending reward into unclaimed
        if (s.amount > 0) {
            uint256 pending = _calculateRewardInternal(msg.sender, s);
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

        uint256 pending = _calculateRewardInternal(staker, s);
        return s.unclaimed + pending;
    }

    /// @dev internal reward calc using provided stake snapshot to avoid re-reading storage twice
    function _calculateRewardInternal(address staker, Stake memory s) internal view returns (uint256) {
        if (s.amount == 0) return 0;
        if (totalStakedAmount == 0) return 0;

        uint256 from = s.lastClaim > 0 ? s.lastClaim : s.since;
        if (block.timestamp <= from) return 0;

        uint256 duration = block.timestamp - from; // seconds

        // userShare scaled by 1e18
        uint256 userShare = (s.amount * 1e18) / totalStakedAmount;

        // reward = rewardPerSecond * duration * userShare / 1e18
        uint256 reward = (rewardRatePerSecondGlobal * duration * userShare) / 1e18;
        return reward;
    }

    // ----------------------------- claim & withdraw -----------------------------

    function claim() external whenNotPaused{
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0 || s.unclaimed > 0, "Nessuno stake o reward");

        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "Nessun reward disponibile");

        // check contract has enough free tokens to pay the reward
        uint256 contractBalance = cerToken.balanceOf(address(this));
        // The contract holds both staked tokens and reward reserve. Ensure we can pay reward now.
        require(contractBalance >= totalStakedAmount + reward, "not enough liquidity for rewards");


        // reset accounting
        s.unclaimed = 0;
        s.lastClaim = block.timestamp;

        cerToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    function withdraw() external whenNotPaused{
        Stake memory s = stakes[msg.sender];
        require(s.amount > 0, "Nessuno stake");

        uint256 reward = calculateReward(msg.sender);
        uint256 principal = s.amount;
        uint256 total = principal + reward;

        // update global state
        totalStakedAmount -= principal;

        // delete stake
        delete stakes[msg.sender];
        _isStaker[msg.sender] = false; // note: stakers array still contains the address

        // safety: check contract has enough tokens to pay principal + reward
        uint256 contractBalance = cerToken.balanceOf(address(this));
        require(contractBalance >= total, "FondI insufficienti per pagare");

        cerToken.safeTransfer(msg.sender, total);
        emit Withdrawn(msg.sender, total);
    }

    function withdrawPartial(uint256 amount) external whenNotPaused{
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "Nessuno stake");
        require(amount > 0 && amount <= s.amount, "Importo non valido");

        // snapshot reward up to now
        uint256 reward = calculateReward(msg.sender);

        // reduce stake and total
        s.amount -= amount;
        totalStakedAmount -= amount;

        // reset reward accounting
        s.unclaimed = 0;
        s.lastClaim = block.timestamp;

        uint256 transferAmount = amount + reward;

        uint256 contractBalance = cerToken.balanceOf(address(this));
        require(contractBalance >= transferAmount, "FondI insufficienti per pagare");

        cerToken.safeTransfer(msg.sender, transferAmount);
        emit Withdrawn(msg.sender, transferAmount);
    }

    // ----------------------------- views -----------------------------

    /// @notice Current APY (annual percentage yield) expressed in 1e18 precision.
    /// APY = (annualRewardBudget / totalStakedAmount)
    function currentAPY() external view returns (uint256) {
        if (totalStakedAmount == 0) return 0;
        // APY in 1e18 precision
        return (annualRewardBudget * 1e18) / totalStakedAmount;
    }

    /// @notice Current daily reward rate per token staked (for frontend helper)
    function dailyRatePerToken() external view returns (uint256) {
        if (totalStakedAmount == 0) return 0;
        uint256 dailyReward = annualRewardBudget / 365;
        return (dailyReward * 1e18) / totalStakedAmount; // scaled
    }

    function getStakers() external view returns (address[] memory) {
        return stakers;
    }

    // ----------------------------- helpers / admins -----------------------------

    /// @notice quick setter to top-up the contract with tokens (owner just transfers tokens to contract address)
    /// This function is only a convenience to check current funding; actual funding is done by ERC20 transfer.
    function contractBalance() external view returns (uint256) {
        return cerToken.balanceOf(address(this));
    }

    function pause() external onlyOwner {
    _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
    }
