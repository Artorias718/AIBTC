// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

// ✅ Alias: in ICO_Proxy.sol the contract is named ICO,
// but in tests we treat it as ICO_Proxy
import { ICO as ICO_Proxy } from "../contracts/ICO_Proxy.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// -----------------------------------------------------------------------
/// Mock ERC20 (6 and 18 decimals)
/// -----------------------------------------------------------------------
contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public immutable decimals;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

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

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
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
/// V2 for UUPS upgrade testing (adds a new function)
/// -----------------------------------------------------------------------
contract ICO_ProxyV2 is ICO_Proxy {
    function version() external pure returns (uint256) {
        return 2;
    }
}

contract ICO_ProxyTest is Test {
    ICO_Proxy internal ico;                 // proxy (ICO_Proxy ABI)
    ICO_Proxy internal implementation;      // implementation V1
    ICO_ProxyV2 internal implementationV2;  // implementation V2

    MockERC20 internal usdc;
    MockERC20 internal aibtc;

    address internal owner = address(this);
    address internal alice = address(0xA11CE);
    address internal bob   = address(0xB0B);

    // Events (must match ICO_Proxy)
    event Deposited(address indexed user, uint256 usdcAmount, uint256 cerAmount);
    event PriceUpdated(uint256 newPrice);
    event SaleStarted();
    event SaleStopped();

    function setUp() public {
        usdc = new MockERC20("USDC", "USDC", 6);
        aibtc = new MockERC20("AIBTC", "AIBTC", 18);

        implementation = new ICO_Proxy();

        bytes memory initData =
            abi.encodeCall(ICO_Proxy.initialize, (address(usdc), address(aibtc)));

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        ico = ICO_Proxy(address(proxy));
    }

    // -----------------------------------------------------------------------
    // Initialize / state
    // -----------------------------------------------------------------------

    function testInitialize_State() public {
        assertEq(address(ico.usdc()), address(usdc));
        assertEq(address(ico.aibtc()), address(aibtc));

        assertTrue(ico.saleActive());
        assertEq(ico.price_usdc(), 10);

        assertEq(ico.owner(), owner);

        assertEq(ico.totalDepositedusdc(), 0);
        assertEq(ico.totalDistributedCER(), 0);
    }

    function testRevert_InitializeTwice() public {
        vm.expectRevert();
        ico.initialize(address(usdc), address(aibtc));
    }

    function testRevert_InitializeOnImplementationDisabled() public {
        // implementation has _disableInitializers() in the constructor
        vm.expectRevert();
        implementation.initialize(address(usdc), address(aibtc));
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    function _fundAndApproveAlice(uint256 usdcAmount) internal {
        usdc.mint(alice, usdcAmount);
        vm.prank(alice);
        usdc.approve(address(ico), usdcAmount);
    }

    function _fundIcoWithAIBTC(uint256 aibtcAmount) internal {
        aibtc.mint(address(ico), aibtcAmount);
    }

    // -----------------------------------------------------------------------
    // Deposit
    // -----------------------------------------------------------------------

    function testRevert_DepositWhenSaleNotActive() public {
        ico.stopSale();
        _fundAndApproveAlice(100 * 1e6);

        vm.prank(alice);
        vm.expectRevert(bytes("Sale not active"));
        ico.deposit(1 * 1e6);
    }

    function testRevert_DepositAmountZero() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Amount is null"));
        ico.deposit(0);
    }

    function testDeposit_HappyPath_EmitsAndUpdatesAccounting() public {
        uint256 amount = 100 * 1e6;

        _fundAndApproveAlice(amount);

        uint256 cerAmount = (amount * 1e14) / ico.price_usdc();
        _fundIcoWithAIBTC(cerAmount);

        uint256 icoUsdcBefore = usdc.balanceOf(address(ico));
        uint256 aliceUsdcBefore = usdc.balanceOf(alice);
        uint256 aliceCerBefore = aibtc.balanceOf(alice);

        vm.expectEmit(true, false, false, true);
        emit Deposited(alice, amount, cerAmount);

        vm.prank(alice);
        ico.deposit(amount);

        assertEq(usdc.balanceOf(address(ico)), icoUsdcBefore + amount);
        assertEq(usdc.balanceOf(alice), aliceUsdcBefore - amount);

        assertEq(aibtc.balanceOf(alice), aliceCerBefore + cerAmount);

        assertEq(ico.totalDepositedusdc(), amount);
        assertEq(ico.totalDistributedCER(), cerAmount);
    }

    function testRevert_DepositFailsIfNotEnoughAIBTCInContract() public {
        uint256 amount = 10 * 1e6;
        _fundAndApproveAlice(amount);

        vm.prank(alice);
        vm.expectRevert(bytes("ERC20: transfer exceeds balance"));
        ico.deposit(amount);
    }

    function testDeposit_UsesUpdatedPrice() public {
        ico.setPrice(20);

        uint256 amount = 50 * 1e6;
        _fundAndApproveAlice(amount);

        uint256 cerAmount = (amount * 1e14) / ico.price_usdc();
        _fundIcoWithAIBTC(cerAmount);

        vm.prank(alice);
        ico.deposit(amount);

        assertEq(aibtc.balanceOf(alice), cerAmount);
        assertEq(ico.totalDistributedCER(), cerAmount);
    }

    // -----------------------------------------------------------------------
    // Admin: setPrice / startSale / stopSale
    // -----------------------------------------------------------------------

    function testOnlyOwner_SetPrice() public {
        vm.prank(alice);
        vm.expectRevert();
        ico.setPrice(11);
    }

    function testSetPrice_RevertIfZero() public {
        vm.expectRevert(bytes("Invalid price"));
        ico.setPrice(0);
    }

    function testSetPrice_EmitsAndUpdates() public {
        vm.expectEmit(false, false, false, true);
        emit PriceUpdated(42);

        ico.setPrice(42);
        assertEq(ico.price_usdc(), 42);
    }

    function testOnlyOwner_StartStopSale() public {
        vm.prank(alice);
        vm.expectRevert();
        ico.stopSale();

        vm.prank(alice);
        vm.expectRevert();
        ico.startSale();
    }

    function testStopSale_EmitsAndToggles() public {
        vm.expectEmit(false, false, false, true);
        emit SaleStopped();

        ico.stopSale();
        assertFalse(ico.saleActive());
    }

    function testStartSale_EmitsAndToggles() public {
        ico.stopSale();

        vm.expectEmit(false, false, false, true);
        emit SaleStarted();

        ico.startSale();
        assertTrue(ico.saleActive());
    }

    // -----------------------------------------------------------------------
    // Withdraw (note: scaling in the contract)
    // -----------------------------------------------------------------------

    function testWithdrawUSDC_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        ico.withdrawUSDC(1);
    }

    function testWithdrawCER_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        ico.withdrawCER(1);
    }

    function testWithdrawUSDC_RevertIfZero() public {
        vm.expectRevert(bytes("Importo nullo"));
        ico.withdrawUSDC(0);
    }

    function testWithdrawCER_RevertIfZero() public {
        vm.expectRevert(bytes("Importo nullo"));
        ico.withdrawCER(0);
    }

    function testWithdrawUSDC_ScalesBy1e6() public {
        usdc.mint(address(ico), 250 * 1e6);

        uint256 ownerBefore = usdc.balanceOf(owner);

        ico.withdrawUSDC(100); // 100 * 1e6

        assertEq(usdc.balanceOf(owner), ownerBefore + 100 * 1e6);
        assertEq(usdc.balanceOf(address(ico)), 250 * 1e6 - 100 * 1e6);
    }

    function testWithdrawCER_ScalesBy1e18() public {
        aibtc.mint(address(ico), 1_000 * 1e18);

        uint256 ownerBefore = aibtc.balanceOf(owner);

        ico.withdrawCER(2); // 2 * 1e18

        assertEq(aibtc.balanceOf(owner), ownerBefore + 2 * 1e18);
        assertEq(aibtc.balanceOf(address(ico)), 1_000 * 1e18 - 2 * 1e18);
    }

    function testWithdrawUSDC_RevertIfInsufficientBalance() public {
        vm.expectRevert(bytes("ERC20: transfer exceeds balance"));
        ico.withdrawUSDC(1);
    }

    function testWithdrawCER_RevertIfInsufficientBalance() public {
        vm.expectRevert(bytes("ERC20: transfer exceeds balance"));
        ico.withdrawCER(1);
    }

    // -----------------------------------------------------------------------
    // UUPS upgrade (OZ5): upgradeToAndCall
    // -----------------------------------------------------------------------

    function testUpgradeToAndCall_OwnerCanUpgrade() public {
        implementationV2 = new ICO_ProxyV2();

        ico.upgradeToAndCall(address(implementationV2), "");

        uint256 v = ICO_ProxyV2(address(ico)).version();
        assertEq(v, 2);
    }

    function testRevert_UpgradeToAndCall_NonOwner() public {
        implementationV2 = new ICO_ProxyV2();

        vm.prank(alice);
        vm.expectRevert();
        ico.upgradeToAndCall(address(implementationV2), "");
    }

    // -----------------------------------------------------------------------
    // Fuzz: accounting on deposit
    // -----------------------------------------------------------------------

    function testFuzz_Deposit_AccountingMatches(uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount <= 1_000_000 * 1e6); // <= 1M USDC

        _fundAndApproveAlice(amount);

        uint256 cerAmount = (amount * 1e14) / ico.price_usdc();
        _fundIcoWithAIBTC(cerAmount);

        uint256 depBefore = ico.totalDepositedusdc();
        uint256 distBefore = ico.totalDistributedCER();

        vm.prank(alice);
        ico.deposit(amount);

        assertEq(ico.totalDepositedusdc(), depBefore + amount);
        assertEq(ico.totalDistributedCER(), distBefore + cerAmount);

        // in our setup alice is always minted exactly "amount" and spends exactly "amount"
        assertEq(usdc.balanceOf(alice), 0);
    }
}