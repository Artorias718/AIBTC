// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../node_modules/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract StakingProxy {
    // distribuisce il proxy puntando al contratto logico
    function deployProxy(
        address logic,
        address admin,
        address cerToken,
        uint256 rewardRate
    ) external returns (address) {
        bytes memory data = abi.encodeWithSignature(
            "initialize(address,uint256)",
            cerToken,
            rewardRate
        );

        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            logic, // indirizzo del contratto Staking
            admin, // chi può aggiornare il proxy
            data // chiama initialize sul contratto logico
        );

        return address(proxy); // ritorna l'indirizzo del proxy
    }
}
