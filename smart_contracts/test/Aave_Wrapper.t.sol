// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../contracts/Aave_Wrapper.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// -----------------------------------------------------------------------
/// Simple Mock ERC20 (approve/transfer/transferFrom) + mint
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
/// Mock Aave Pool:
/// - supply(): pulls USDC from the caller (wrapper) and "mints" aToken to onBehalfOf
/// - withdraw(): sends USDC to `to` (we do not handle burning aToken for simplicity)
/// -----------------------------------------------------------------------
contract MockPool is IPool {
    IERC20 public usdc;
    address public aTokenAddr;

    // tracking for tests
    address public lastAsset;
    uint256 public lastAmount;
    address public lastOnBehalfOf;
    uint16 public lastReferral;

    constructor(IERC20 _usdc, address _aTokenAddr) {
        usdc = _usdc;
        aTokenAddr = _aTokenAddr;
    }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external override {
        lastAsset = asset;
        lastAmount = amount;
        lastOnBehalfOf = onBehalfOf;
        lastReferral = referralCode;

        // Simulate Aave: pulls funds from the wrapper (msg.sender), via allowance
        require(IERC20(asset).transferFrom(msg.sender, address(this), amount), "POOL: transferFrom failed");

        // Simulate minting aToken (1:1) in favor of the user
        MockERC20(aTokenAddr).mint(onBehalfOf, amount);
    }

    function withdraw(address asset, uint256 amount, address to) external override returns (uint256) {
        // Simulate Aave: sends USDC to the recipient
        require(IERC20(asset).transfer(to, amount), "POOL: transfer failed");
        return amount;
    }
}

contract AaveWrapperTest is Test {
    // hardcoded in the contract
    address internal constant ATOKEN_HARDCODED = 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC;
    address internal constant FEE_RECIPIENT     = 0x709c729ad1Bf900dfa503a9E510175FD65135cDB;

    MockERC20 internal usdc;
    MockPool internal pool;
    AaveWrapper internal wrapper;

    address internal alice = address(0xA11CE);
    address internal bob   = address(0xB0B);

    function setUp() public {
        // USDC mock (realistic 6 decimals, but it's not critical here)
        usdc = new MockERC20("USDC", "USDC", 6);

        // Deploy "logic" aToken mock and copy the bytecode to the hardcoded address
        MockERC20 aTokenLogic = new MockERC20("aUSDC", "aUSDC", 6);
        vm.etch(ATOKEN_HARDCODED, address(aTokenLogic).code);

        // Now the aToken contract really lives at ATOKEN_HARDCODED, with its own storage.
        // (we don't care about initializing name/symbol/decimals in these tests)

        // Mock pool that will use that aToken
        pool = new MockPool(IERC20(usdc), ATOKEN_HARDCODED);

        // Wrapper
        wrapper = new AaveWrapper(IERC20(usdc), IPool(pool));
    }

    function aToken() internal view returns (MockERC20) {
        return MockERC20(ATOKEN_HARDCODED);
    }

    // -----------------------------------------------------------------------
    // Deposit
    // -----------------------------------------------------------------------

    function testDeposit_HappyPath_TakesFee_SuppliesToPool_MintsAToken() public {
        uint256 amount = 100_000_000; // 100 USDC if 6 decimals

        // fund + approve
        usdc.mint(alice, amount);
        vm.prank(alice);
        usdc.approve(address(wrapper), amount);

        uint256 fee = (amount * 1) / 100;
        uint256 afterFee = amount - fee;

        uint256 feeBefore = usdc.balanceOf(FEE_RECIPIENT);
        uint256 aliceBefore = usdc.balanceOf(alice);

        // deposit
        vm.prank(alice);
        wrapper.deposit(amount);

        // fee transferred
        assertEq(usdc.balanceOf(FEE_RECIPIENT), feeBefore + fee);

        // alice spent amount
        assertEq(usdc.balanceOf(alice), aliceBefore - amount);

        // wrapper approves the pool and the pool pulls afterFee => wrapper should end at 0
        assertEq(usdc.balanceOf(address(wrapper)), 0);

        // pool received afterFee
        assertEq(usdc.balanceOf(address(pool)), afterFee);

        // aToken minted to alice
        assertEq(aToken().balanceOf(alice), afterFee);

        // pool call tracking
        assertEq(pool.lastAsset(), address(usdc));
        assertEq(pool.lastAmount(), afterFee);
        assertEq(pool.lastOnBehalfOf(), alice);
        assertEq(pool.lastReferral(), 0);

        // allowance wrapper->pool = afterFee (wrapper calls approve)
        assertEq(usdc.allowance(address(wrapper), address(pool)), afterFee);
    }

    function testDeposit_RevertIfNoAllowance() public {
        uint256 amount = 10_000_000;
        usdc.mint(alice, amount);

        // NO approval to the wrapper => safeTransferFrom must revert
        vm.prank(alice);
        vm.expectRevert(); // SafeERC20 / mock revert
        wrapper.deposit(amount);
    }

    function testDeposit_SmallAmount_FeeRoundsToZero() public {
        uint256 amount = 1; // fee = 0
        usdc.mint(alice, amount);
        vm.prank(alice);
        usdc.approve(address(wrapper), amount);

        vm.prank(alice);
        wrapper.deposit(amount);

        // fee 0, afterFee 1 => aToken minted is 1
        assertEq(aToken().balanceOf(alice), 1);
        assertEq(usdc.balanceOf(FEE_RECIPIENT), 0);
    }

    // -----------------------------------------------------------------------
    // Withdraw
    // -----------------------------------------------------------------------

    function _setupWithdrawScenario(address user, uint256 amountAToken) internal {
        // assign aToken to the user (as if they had deposited)
        aToken().mint(user, amountAToken);

        // user must approve the wrapper to take aToken
        vm.prank(user);
        aToken().approve(address(wrapper), amountAToken);

        // pool must have enough USDC to pay the withdraw
        usdc.mint(address(pool), amountAToken);
    }

    function testWithdraw_HappyPath_TakesFee_PaysUser() public {
        uint256 amount = 50_000_000;

        _setupWithdrawScenario(alice, amount);

        uint256 fee = (amount * 1) / 100;
        uint256 afterFee = amount - fee;

        uint256 feeBefore = usdc.balanceOf(FEE_RECIPIENT);
        uint256 aliceBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        wrapper.withdraw(amount);

        // fee recipient receives fee
        assertEq(usdc.balanceOf(FEE_RECIPIENT), feeBefore + fee);

        // alice receives afterFee
        assertEq(usdc.balanceOf(alice), aliceBefore + afterFee);

        // pool pays amount to the wrapper, wrapper forwards out fee+afterFee => wrapper ends at 0
        assertEq(usdc.balanceOf(address(wrapper)), 0);

        // aToken: wrapper took them via transferFrom
        assertEq(aToken().balanceOf(alice), 0);
        assertEq(aToken().balanceOf(address(wrapper)), amount);
    }

    function testRevert_Withdraw_InsufficientATokenBalance() public {
        uint256 amount = 1_000_000;

        // alice has no aToken
        vm.prank(alice);
        vm.expectRevert(bytes("Insufficient balance"));
        wrapper.withdraw(amount);
    }

    function testRevert_Withdraw_NoATokenAllowance() public {
        uint256 amount = 2_000_000;

        // alice has aToken but does NOT approve the wrapper
        aToken().mint(alice, amount);

        // pool has USDC
        usdc.mint(address(pool), amount);

        vm.prank(alice);
        vm.expectRevert(bytes("ERC20: insufficient allowance"));
        wrapper.withdraw(amount);
    }

    function testRevert_Withdraw_PoolHasNotEnoughUSDC() public {
        uint256 amount = 10_000_000;

        // alice has aToken and approves
        aToken().mint(alice, amount);
        vm.prank(alice);
        aToken().approve(address(wrapper), amount);

        // pool does NOT have enough USDC => transfer in pool withdraw() reverts
        vm.prank(alice);
        vm.expectRevert(); // "POOL: transfer failed" or "ERC20: transfer exceeds balance"
        wrapper.withdraw(amount);
    }

    // -----------------------------------------------------------------------
    // Sanity: constructor wiring
    // -----------------------------------------------------------------------

    function testConstructor_WiresDependencies() public {
        assertEq(address(wrapper.usdc()), address(usdc));
        assertEq(address(wrapper.aavePool()), address(pool));

        // feeRecipient is hardcoded in the contract
        assertEq(wrapper.feeRecipient(), FEE_RECIPIENT);
    }
}