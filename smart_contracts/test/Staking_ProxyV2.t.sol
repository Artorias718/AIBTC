// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";

// ✅ Alias: in Staking_ProxyV2.sol the contract is named Staking,
// but in tests we treat it as Staking_ProxyV2
import { Staking as Staking_ProxyV2 } from "../contracts/Staking_ProxyV2.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// -----------------------------------------------------------------------
/// Mock ERC20 compatible with SafeERC20 (returns bool, reverts if balance is insufficient)
/// -----------------------------------------------------------------------
contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public immutable decimals;

    uint256 public override totalSupply;
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    constructor(string memory n, string memory s, uint8 d) {
        name = n;
        symbol = s;
        decimals = d;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 a = allowance[from][msg.sender];
        require(a >= amount, "ERC20: insufficient allowance");
        allowance[from][msg.sender] = a - amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "ERC20: transfer to zero");
        uint256 b = balanceOf[from];
        require(b >= amount, "ERC20: transfer exceeds balance");
        balanceOf[from] = b - amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

/// -----------------------------------------------------------------------
/// V2 for UUPS upgrade testing
/// -----------------------------------------------------------------------
contract Staking_ProxyV2_Impl is Staking_ProxyV2 {
    function version() external pure returns (uint256) {
        return 2;
    }
}

contract Staking_ProxyV2_Test is Test {
    Staking_ProxyV2 internal staking;
    Staking_ProxyV2 internal implementation;
    Staking_ProxyV2_Impl internal implementationV2;

    MockERC20 internal cer;

    address internal owner = address(this);
    address internal alice = address(0xA11CE);
    address internal bob   = address(0xB0B);

    // events (must match the contract)
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event AnnualBudgetUpdated(uint256 newBudget);
    event RewardsRestarted(uint256 newBudget, uint256 newRewardsEnd);

    uint256 internal constant YEAR = 365 days;

    function setUp() public {
        cer = new MockERC20("CER", "CER", 18);

        implementation = new Staking_ProxyV2();

        // annual budget: 365 tokens * 1e18 => 1 token/sec? no, it depends; here it's simplified for testing
        uint256 annualBudget = 3650e18;

        bytes memory initData =
            abi.encodeCall(Staking_ProxyV2.initialize, (address(cer), annualBudget));

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        staking = Staking_ProxyV2(address(proxy));
    }

    // -----------------------------------------------------------------------
    // Initialize / state
    // -----------------------------------------------------------------------

    function testInitialize_State() public {
        assertEq(staking.owner(), owner);
        assertEq(address(staking.cerToken()), address(cer));

        // budget and rate are consistent
        uint256 budget = staking.annualRewardBudget();
        assertEq(staking.rewardRatePerSecondGlobal(), budget / YEAR);

        // rewardsEnd = now + 365d (within 1s)
        uint256 end = staking.rewardsEnd();
        assertApproxEqAbs(end, block.timestamp + YEAR, 1);

        assertEq(staking.totalStakedAmount(), 0);
        assertEq(staking.getStakers().length, 0);
    }

    function testRevert_InitializeTwice() public {
        vm.expectRevert();
        staking.initialize(address(cer), 1);
    }

    function testRevert_InitializeOnImplementationDisabled() public {
        vm.expectRevert();
        implementation.initialize(address(cer), 1);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    function _mintApprove(address user, uint256 amount) internal {
        cer.mint(user, amount);
        vm.prank(user);
        cer.approve(address(staking), amount);
    }

    function _stakeAs(address user, uint256 amount) internal {
        _mintApprove(user, amount);
        vm.prank(user);
        staking.stake(amount);
    }

    function _fundRewards(uint256 amount) internal {
        // Fund the contract with extra rewards (in addition to the staked tokens)
        cer.mint(address(staking), amount);
    }

    // -----------------------------------------------------------------------
    // Stake
    // -----------------------------------------------------------------------

    function testRevert_StakeZero() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Amount is zero"));
        staking.stake(0);
    }

    function testStake_FirstTime_AddsStakerAndUpdatesState() public {
        uint256 amount = 100e18;
        _mintApprove(alice, amount);

        vm.expectEmit(true, false, false, true);
        emit Staked(alice, amount);

        vm.prank(alice);
        staking.stake(amount);

        // stake struct
        (uint256 a, uint256 since_, uint256 lastClaim_, uint256 unclaimed_) = staking.stakes(alice);
        assertEq(a, amount);
        assertEq(unclaimed_, 0);
        assertEq(since_, block.timestamp);
        assertEq(lastClaim_, block.timestamp);

        // global
        assertEq(staking.totalStakedAmount(), amount);

        // stakers list
        address[] memory list = staking.getStakers();
        assertEq(list.length, 1);
        assertEq(list[0], alice);
    }

    function testStake_SecondStake_SnapshotsPendingIntoUnclaimed() public {
        uint256 amount1 = 100e18;
        _stakeAs(alice, amount1);

        // fund reward liquidity (otherwise claim/withdraw could fail)
        _fundRewards(10_000e18);

        vm.warp(block.timestamp + 7 days);

        uint256 before = staking.calculateReward(alice);
        assertGt(before, 0);

        uint256 amount2 = 50e18;
        // to do stake2 we need an approval for amount2 (if we haven't already)
        _mintApprove(alice, amount2);

        vm.prank(alice);
        staking.stake(amount2);

        // After stake2: pending should have been moved into unclaimed and lastClaim updated
        (, , uint256 lastClaimAfter, uint256 unclaimedAfter) = staking.stakes(alice);
        assertEq(lastClaimAfter, block.timestamp);
        assertGt(unclaimedAfter, 0);

        // total reward immediately after stake2 should be ~unclaimed (pending is 0 because lastClaim==now)
        uint256 rewardAfter = staking.calculateReward(alice);
        assertEq(rewardAfter, unclaimedAfter);
    }

    // -----------------------------------------------------------------------
    // Reward calculation: capped at rewardsEnd
    // -----------------------------------------------------------------------

    function testCalculateReward_CappedAtRewardsEnd() public {
        _stakeAs(alice, 100e18);
        _fundRewards(1_000_000e18);

        uint256 end = staking.rewardsEnd();

        // go past the end of the period
        vm.warp(end + 30 days);

        uint256 r1 = staking.calculateReward(alice);
        assertGt(r1, 0);

        // more time beyond end must not increase rewards
        vm.warp(end + 200 days);
        uint256 r2 = staking.calculateReward(alice);

        assertEq(r2, r1);
        assertEq(staking.currentAPY(), 0);
        assertEq(staking.dailyRatePerToken(), 0);
    }

    function testViews_APYAndDailyRate_ZeroWhenNoStake() public {
        assertEq(staking.currentAPY(), 0);
        assertEq(staking.dailyRatePerToken(), 0);
    }

    // -----------------------------------------------------------------------
    // Claim
    // -----------------------------------------------------------------------

    function testRevert_Claim_NoStakeOrReward() public {
        vm.prank(alice);
        vm.expectRevert(bytes("No stake or reward"));
        staking.claim();
    }

    function testRevert_Claim_NoRewardAvailable() public {
        // stake and claim immediately => reward=0
        _stakeAs(alice, 100e18);
        _fundRewards(1_000e18);

        vm.prank(alice);
        vm.expectRevert(bytes("No reward available"));
        staking.claim();
    }

    function testRevert_Claim_NotEnoughLiquidityForRewards() public {
        // staking creates contractBalance = totalStaked
        _stakeAs(alice, 100e18);

        // do NOT fund extra rewards -> liquidity check must fail if reward>0
        vm.warp(block.timestamp + 1 days);

        vm.prank(alice);
        vm.expectRevert(bytes("not enough liquidity for rewards"));
        staking.claim();
    }

    function testClaim_HappyPath_TransfersRewardAndResetsAccounting() public {
        _stakeAs(alice, 100e18);
        _fundRewards(1_000_000e18);

        vm.warp(block.timestamp + 10 days);

        uint256 reward = staking.calculateReward(alice);
        assertGt(reward, 0);

        uint256 aliceBefore = cer.balanceOf(alice);

        vm.expectEmit(true, false, false, true);
        emit RewardClaimed(alice, reward);

        vm.prank(alice);
        staking.claim();

        // balance increased
        assertEq(cer.balanceOf(alice), aliceBefore + reward);

        // unclaimed reset
        (, , uint256 lastClaimAfter, uint256 unclaimedAfter) = staking.stakes(alice);
        assertEq(unclaimedAfter, 0);
        assertEq(lastClaimAfter, block.timestamp);

        // immediately after, reward ~ 0
        assertEq(staking.calculateReward(alice), 0);
    }

    // -----------------------------------------------------------------------
    // Withdraw (full)
    // -----------------------------------------------------------------------

    function testRevert_Withdraw_NoStake() public {
        vm.prank(alice);
        vm.expectRevert(bytes("No stake"));
        staking.withdraw();
    }

    function testRevert_Withdraw_InsufficientFundsToPay() public {
        _stakeAs(alice, 100e18);

        // make reward > 0
        vm.warp(block.timestamp + 3 days);

        // but do not add reward liquidity -> contractBalance == totalStaked < principal+reward
        vm.prank(alice);
        vm.expectRevert(bytes("Insufficient funds to pay"));
        staking.withdraw();
    }

    function testWithdraw_HappyPath_PaysPrincipalPlusReward_DeletesStake() public {
        _stakeAs(alice, 100e18);
        _fundRewards(1_000_000e18);

        vm.warp(block.timestamp + 20 days);

        uint256 reward = staking.calculateReward(alice);
        uint256 expectedTotal = 100e18 + reward;

        uint256 aliceBefore = cer.balanceOf(alice);

        vm.expectEmit(true, false, false, true);
        emit Withdrawn(alice, expectedTotal);

        vm.prank(alice);
        staking.withdraw();

        assertEq(cer.balanceOf(alice), aliceBefore + expectedTotal);
        assertEq(staking.totalStakedAmount(), 0);

        // stake deleted
        (uint256 a, uint256 since_, uint256 last_, uint256 unclaimed_) = staking.stakes(alice);
        assertEq(a, 0);
        assertEq(since_, 0);
        assertEq(last_, 0);
        assertEq(unclaimed_, 0);

        // the stakers array is not cleaned up (by design), but _isStaker is set to false (not readable here)
        // therefore: getStakers still contains alice
        address[] memory list = staking.getStakers();
        assertEq(list.length, 1);
        assertEq(list[0], alice);
    }

    // -----------------------------------------------------------------------
    // Withdraw partial
    // -----------------------------------------------------------------------

    function testRevert_WithdrawPartial_NoStake() public {
        vm.prank(alice);
        vm.expectRevert(bytes("No stake"));
        staking.withdrawPartial(1);
    }

    function testRevert_WithdrawPartial_InvalidAmount() public {
        _stakeAs(alice, 100e18);

        vm.prank(alice);
        vm.expectRevert(bytes("Invalid amount"));
        staking.withdrawPartial(0);

        vm.prank(alice);
        vm.expectRevert(bytes("Invalid amount"));
        staking.withdrawPartial(101e18);
    }

    function testWithdrawPartial_HappyPath_ReducesStakeAndPaysAmountPlusReward() public {
        _stakeAs(alice, 100e18);
        _fundRewards(1_000_000e18);

        vm.warp(block.timestamp + 5 days);

        uint256 reward = staking.calculateReward(alice);
        uint256 withdrawAmount = 40e18;
        uint256 expectedTransfer = withdrawAmount + reward;

        uint256 aliceBefore = cer.balanceOf(alice);

        vm.expectEmit(true, false, false, true);
        emit Withdrawn(alice, expectedTransfer);

        vm.prank(alice);
        staking.withdrawPartial(withdrawAmount);

        // received amount + reward
        assertEq(cer.balanceOf(alice), aliceBefore + expectedTransfer);

        // stake reduced
        (uint256 stakedAfter, , uint256 lastClaimAfter, uint256 unclaimedAfter) = staking.stakes(alice);
        assertEq(stakedAfter, 60e18);
        assertEq(unclaimedAfter, 0);
        assertEq(lastClaimAfter, block.timestamp);

        // total staked reduced
        assertEq(staking.totalStakedAmount(), 60e18);

        // immediately after: reward ~ 0
        assertEq(staking.calculateReward(alice), 0);
    }

function testRevert_WithdrawPartial_InsufficientFundsToPay() public {
    // Normal stake: contractBalance = totalStaked = 100e18
    _stakeAs(alice, 100e18);

    // Set a huge budget to make rewards huge in a short time
    // (only the owner can do it -> here we are the owner)
    staking.setAnnualRewardBudget(10_000_000_000e18);

    // Wait long enough for reward to grow > (contractBalance - amount)
    // so amount + reward > contractBalance and it must revert.
    vm.warp(block.timestamp + 30 days);

    vm.prank(alice);
    vm.expectRevert(bytes("Insufficient funds to pay"));
    staking.withdrawPartial(10e18);
}

    // -----------------------------------------------------------------------
    // Pause / unpause
    // -----------------------------------------------------------------------

    function testOnlyOwner_PauseUnpause() public {
        vm.prank(alice);
        vm.expectRevert();
        staking.pause();

        vm.prank(alice);
        vm.expectRevert();
        staking.unpause();
    }

    function testPause_BlocksStakeClaimWithdraw() public {
        staking.pause();

        _mintApprove(alice, 100e18);

        vm.prank(alice);
        vm.expectRevert(); // PausableUpgradeable revert
        staking.stake(100e18);

        vm.prank(alice);
        vm.expectRevert();
        staking.claim();

        vm.prank(alice);
        vm.expectRevert();
        staking.withdraw();

        staking.unpause();
    }

    // -----------------------------------------------------------------------
    // Owner: setAnnualRewardBudget / restartRewards / recoverExcessTokens
    // -----------------------------------------------------------------------

    function testOnlyOwner_SetAnnualRewardBudget() public {
        vm.prank(alice);
        vm.expectRevert();
        staking.setAnnualRewardBudget(1);
    }

    function testSetAnnualRewardBudget_EmitsAndUpdatesRate() public {
        uint256 newBudget = 999e18;

        vm.expectEmit(false, false, false, true);
        emit AnnualBudgetUpdated(newBudget);

        staking.setAnnualRewardBudget(newBudget);

        assertEq(staking.annualRewardBudget(), newBudget);
        assertEq(staking.rewardRatePerSecondGlobal(), newBudget / YEAR);
    }

    function testRestartRewards_RevertIfPreviousStillActive() public {
        vm.expectRevert(bytes("Previous period still active"));
        staking.restartRewards(1);
    }

    function testRestartRewards_RevertIfBudgetZero() public {
        // move time past rewardsEnd
        vm.warp(staking.rewardsEnd());

        vm.expectRevert(bytes("Budget must be > 0"));
        staking.restartRewards(0);
    }

    function testRestartRewards_HappyPath_UpdatesEndAndEmits() public {
        // finish the period
        vm.warp(staking.rewardsEnd() + 1);

        uint256 newBudget = 12345e18;

        vm.expectEmit(false, false, false, true);
        emit RewardsRestarted(newBudget, block.timestamp + YEAR);

        staking.restartRewards(newBudget);

        assertEq(staking.annualRewardBudget(), newBudget);
        assertApproxEqAbs(staking.rewardsEnd(), block.timestamp + YEAR, 1);
    }

    function testOnlyOwner_RecoverExcessTokens() public {
        MockERC20 other = new MockERC20("OTHER", "OTHER", 18);
        other.mint(address(staking), 10e18);

        vm.prank(alice);
        vm.expectRevert();
        staking.recoverExcessTokens(address(other), alice, 1e18);
    }

    function testRecoverExcessTokens_RevertIfCerToken() public {
        vm.expectRevert(bytes("use dedicated flow for cerToken"));
        staking.recoverExcessTokens(address(cer), owner, 1);
    }

    function testRecoverExcessTokens_HappyPath() public {
        MockERC20 other = new MockERC20("OTHER", "OTHER", 18);
        other.mint(address(staking), 10e18);

        staking.recoverExcessTokens(address(other), owner, 3e18);
        assertEq(other.balanceOf(owner), 3e18);
        assertEq(other.balanceOf(address(staking)), 7e18);
    }

    // -----------------------------------------------------------------------
    // rewardsActive view
    // -----------------------------------------------------------------------

    function testRewardsActive_TogglesAfterEnd() public {
        assertTrue(staking.rewardsActive());

        vm.warp(staking.rewardsEnd());
        assertFalse(staking.rewardsActive());
    }

    // -----------------------------------------------------------------------
    // UUPS upgrade (OZ5): upgradeToAndCall
    // -----------------------------------------------------------------------

    function testUpgradeToAndCall_OwnerCanUpgrade() public {
        implementationV2 = new Staking_ProxyV2_Impl();
        staking.upgradeToAndCall(address(implementationV2), "");

        uint256 v = Staking_ProxyV2_Impl(address(staking)).version();
        assertEq(v, 2);
    }

    function testRevert_UpgradeToAndCall_NonOwner() public {
        implementationV2 = new Staking_ProxyV2_Impl();

        vm.prank(alice);
        vm.expectRevert();
        staking.upgradeToAndCall(address(implementationV2), "");
    }

    // -----------------------------------------------------------------------
    // Fuzz: withdrawPartial amount within stake
    // -----------------------------------------------------------------------

    function testFuzz_WithdrawPartial_ValidAmount(uint256 amt) public {
        uint256 stakeAmt = 1000e18;
        _stakeAs(alice, stakeAmt);
        _fundRewards(1_000_000e18);

        vm.warp(block.timestamp + 2 days);

        vm.assume(amt > 0 && amt <= stakeAmt);

        vm.prank(alice);
        staking.withdrawPartial(amt);

        (uint256 stakedAfter,,,) = staking.stakes(alice);
        assertEq(stakedAfter, stakeAmt - amt);
    }
}