// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract WheelGame {
    IERC20 public aibtcToken;
    uint256 public ticketPrice = 1 * 10 ** 18; // 1 AIBTC, assumendo 18 decimali

    // Evento che il frontend può ascoltare
    event SpinResult(address indexed player, uint256 prizeIndex);

    constructor(address _aibtcToken) {
        aibtcToken = IERC20(_aibtcToken);
    }

    function spinWheel() external payable {
        // Trasferisce il prezzo del ticket al contratto
        require(
            aibtcToken.transferFrom(msg.sender, address(this), ticketPrice),
            "Pagamento fallito"
        );

        // Per ora premio fisso, es. 0
        uint256 prizeIndex = 0;

        // Emissione evento con vincitore
        emit SpinResult(msg.sender, prizeIndex);
    }
}
