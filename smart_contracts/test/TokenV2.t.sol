// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/TokenV2.sol";

contract TokenTest is Test {
    Token token;

    address owner = address(this); // in tests, address(this) is the deployer
    address alice = address(0xA11CE);
    address bob   = address(0xB0B);
    address feeCollector = address(0xFEE);

    function setUp() public {
        token = new Token();
    }

    // -----------------------
    // Deploy / metadata
    // -----------------------

    function testInitialMetadata() public {
        assertEq(token.name(), "AIBTC");
        assertEq(token.symbol(), "AI Bitcoin");
        assertEq(token.decimals(), 18);
    }

    function testInitialSupplyMintedToOwner() public {
        uint256 expected = 21_000_000 * 10 ** token.decimals();
        assertEq(token.totalSupply(), expected);
        assertEq(token.balanceOf(owner), expected);
    }

    function testInitialFeeSettings() public {
        assertEq(token.feeBasisPoints(), 100); // 1%
        assertEq(token.MAX_FEE_BPS(), 300);
        assertEq(token.feeCollector(), owner);
        assertEq(token.feeEnabled(), false);

        assertTrue(token.isFeeExempt(owner));
        //assertTrue(token.isTradingExempt(owner));
        assertFalse(token.tradingEnabled());
        assertFalse(token.tradingPermanentlyEnabled());
    }

    // -----------------------
    // Trading lock behavior
    // -----------------------

    function testRevert_TransferWhenTradingDisabledAndNotExempt() public {
        // owner (exempt) can send to alice even if trading is disabled
        token.transfer(alice, 100e18);

        // alice is NOT exempt by default: transfers should revert
        vm.prank(alice);
        vm.expectRevert(bytes("Trading not enabled"));
        token.transfer(bob, 1e18);
    }

    function testTradingExemptAllowsTransferBeforeEnableTrading() public {
        // owner funds alice
        token.transfer(alice, 100e18);

        // owner sets alice as trading-exempt
        token.setTradingExempt(alice, true);

        vm.prank(alice);
        token.transfer(bob, 10e18);

        assertEq(token.balanceOf(bob), 10e18);
    }

    function testEnableTradingAllowsAnyoneToTransfer() public {
        token.transfer(alice, 100e18);

        token.enableTrading();

        vm.prank(alice);
        token.transfer(bob, 10e18);

        assertEq(token.balanceOf(bob), 10e18);
        assertTrue(token.tradingEnabled());
        assertTrue(token.tradingPermanentlyEnabled());
    }

    function testRevert_EnableTradingTwice() public {
        token.enableTrading();
        vm.expectRevert(bytes("Trading already permanently enabled"));
        token.enableTrading();
    }

    function testOnlyOwner_setTradingExempt() public {
        vm.prank(alice);
        vm.expectRevert(); // Ownable revert (string depends on OZ)
        token.setTradingExempt(bob, true);
    }

    // -----------------------
    // Fee logic
    // -----------------------

    function testNoFeeWhenFeeDisabled() public {
        // enable trading so transfers don't revert
        token.enableTrading();

        token.transfer(alice, 100e18);

        // fee is disabled by default, so bob gets full amount
        vm.prank(alice);
        token.transfer(bob, 10e18);

        assertEq(token.balanceOf(bob), 10e18);
        //assertEq(token.balanceOf(token.feeCollector()), token.balanceOf(owner) - 100e18); // collector is owner, but fee=0 so no extra movement
    }

    function testFeeAppliedWhenEnabledAndSenderNotExempt() public {
        token.enableTrading();

        // set fee collector to a separate address so we can measure easily
        token.setFeeCollector(feeCollector);

        // enable fee (1% default = 100 bps)
        token.setFeeEnabled(true);

        // owner is fee-exempt by default; so first send to alice won't charge a fee
        token.transfer(alice, 100e18);
        assertEq(token.balanceOf(feeCollector), 0);

        // alice sends 10 tokens to bob; fee should be 0.1 token (1%)
        uint256 amount = 10e18;
        uint256 fee = (amount * token.feeBasisPoints()) / 10000; // 1%
        uint256 afterFee = amount - fee;

        vm.prank(alice);
        token.transfer(bob, amount);

        assertEq(token.balanceOf(bob), afterFee);
        assertEq(token.balanceOf(feeCollector), fee);
    }

    function testNoFeeWhenSenderIsFeeExempt() public {
        token.enableTrading();
        token.setFeeCollector(feeCollector);
        token.setFeeEnabled(true);

        token.transfer(alice, 100e18);

        // make alice fee-exempt
        token.setFeeExempt(alice, true);

        vm.prank(alice);
        token.transfer(bob, 10e18);

        assertEq(token.balanceOf(bob), 10e18);
        assertEq(token.balanceOf(feeCollector), 0);
    }

    function testSetFee_RevertIfTooHigh() public {
        vm.expectRevert(bytes("Fee too high"));
        token.setFee(301);
    }

    function testSetFee_WithinMax() public {
        token.setFee(300);
        assertEq(token.feeBasisPoints(), 300);
    }

    function testSetFeeCollector_RevertZeroAddress() public {
        vm.expectRevert(bytes("Invalid address"));
        token.setFeeCollector(address(0));
    }

    function testOnlyOwner_feeControls() public {
        vm.prank(alice);
        vm.expectRevert();
        token.setFeeEnabled(true);

        vm.prank(alice);
        vm.expectRevert();
        token.setFee(200);

        vm.prank(alice);
        vm.expectRevert();
        token.setFeeCollector(feeCollector);

        vm.prank(alice);
        vm.expectRevert();
        token.setFeeExempt(bob, true);
    }

    // -----------------------
    // Mint / Burn
    // -----------------------

    function testBurn_DecreasesSupplyAndBalance() public {
        token.enableTrading();

        token.transfer(alice, 10e18);

        uint256 supplyBefore = token.totalSupply();

        vm.prank(alice);
        token.burn(3e18);

        assertEq(token.balanceOf(alice), 7e18);
        assertEq(token.totalSupply(), supplyBefore - 3e18);
    }

    function testRevert_BurnMoreThanBalance() public {
        vm.prank(alice);
        vm.expectRevert(); // OZ ERC20 burn revert
        token.burn(1e18);
    }

    // -----------------------
    // Fuzzing: fee invariant
    // -----------------------

    function testFuzz_FeeDoesNotCreateTokens(uint256 amount) public {
        token.enableTrading();
        token.setFeeCollector(feeCollector);
        token.setFeeEnabled(true);

        // fund alice from owner (owner is fee-exempt, so no fee on this transfer)
        token.transfer(alice, 1_000e18);

        // random transfer amount within alice's balance
        vm.assume(amount > 0 && amount <= token.balanceOf(alice));

        uint256 supplyBefore = token.totalSupply();
        uint256 aliceBefore = token.balanceOf(alice);
        uint256 bobBefore = token.balanceOf(bob);
        uint256 feeBefore = token.balanceOf(feeCollector);

        vm.prank(alice);
        token.transfer(bob, amount);

        // supply unchanged
        assertEq(token.totalSupply(), supplyBefore);

        // alice decreased exactly by amount
        assertEq(token.balanceOf(alice), aliceBefore - amount);

        // bob + feeCollector increased exactly by amount
        uint256 bobDelta = token.balanceOf(bob) - bobBefore;
        uint256 feeDelta = token.balanceOf(feeCollector) - feeBefore;
        assertEq(bobDelta + feeDelta, amount);
    }
}