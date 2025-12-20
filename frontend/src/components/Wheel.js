import React, { useRef, useState } from "react";
//import { Gift } from "lucide-react"; // solo se vuoi icone decorative
import { WheelOfFortune } from "../libs/dist/components/wheel-of-fortune.js"; // il tuo wheel copiato dalla libreria
import { ethers } from "ethers";

const AIBTC_ADDRESS = "0x7af07eA4914cA38047fdf27c233E1FcA7B8A4852"; // inserisci qui l'indirizzo del token AIBTC
const WHEEL_ABI = [
  {
    inputs: [{ internalType: "address", name: "_aibtcToken", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "prizeIndex",
        type: "uint256",
      },
    ],
    name: "SpinResult",
    type: "event",
  },
  {
    inputs: [],
    name: "aibtcToken",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "spinWheel",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "ticketPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];
const WHEEL_ADDRESS = "0x4cF17CC4407678Eb93Af624E0ebb6198F00314E5";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

// Pulsante personalizzato
function SpinButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 shadow-2xl transform transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 animate-pulse opacity-75"></div>
      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 border-4 border-white shadow-inner flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-bold text-base tracking-wider drop-shadow-lg">
            GIRA
          </div>
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-yellow-200 opacity-50 group-hover:animate-spin"></div>
      </div>
    </button>
  );
}

// Puntatore triangolare personalizzato
function PointerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path fill="red" d="M12 0L15 12H9L12 0Z" />
    </svg>
  );
}

export default function WheelGame() {
  const wheelRef = useRef(null);
  const [winner, setWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const prizes = [
    {
      key: "1",
      color: "#FF5733",
      prize: <div className="text-white font-bold text-lg">💰 10$</div>,
      probability: 0.25,
    },
    {
      key: "2",
      color: "#33C1FF",
      prize: <div className="text-white font-bold text-lg">💎 50$</div>,
      probability: 0.25,
    },
    {
      key: "3",
      color: "#B833FF",
      prize: <div className="text-white font-bold text-lg">😢 Riprova</div>,
      probability: 0.25,
    },
    {
      key: "4",
      color: "#33FF57",
      prize: <div className="text-white font-bold text-lg">🎁 Bonus</div>,
      probability: 0.25,
    },
  ];

  const handleSpinEnd = (prize) => {
    setWinner(prize);
    alert(`Hai vinto: ${prize.prize.props.children}`);
  };

  const spinWheel = async () => {
    if (isSpinning) return;
    setIsSpinning(true);

    try {
      if (!window.ethereum) {
        alert("Installa MetaMask!");
        setIsSpinning(false);
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const wheelContract = new ethers.Contract(
        WHEEL_ADDRESS,
        WHEEL_ABI,
        signer
      );
      const tokenContract = new ethers.Contract(
        AIBTC_ADDRESS,
        ERC20_ABI,
        signer
      );

      const fromAddress = await signer.getAddress();

      // Ottieni prezzo ticket
      const price = await wheelContract.ticketPrice();
      console.log("Ticket price:", price.toString());

      // Controlla saldo token
      const balance = await tokenContract.balanceOf(fromAddress);
      if (balance.lt(price)) {
        alert("Saldo AIBTC insufficiente!");
        setIsSpinning(false);
        return;
      }

      // Controlla allowance
      const allowance = await tokenContract.allowance(
        fromAddress,
        WHEEL_ADDRESS
      );
      if (allowance.lt(price)) {
        console.log("Approving token spend...");
        const approveTx = await tokenContract.approve(WHEEL_ADDRESS, price);
        await approveTx.wait();
        console.log("Approve completato");
      }

      // Ascolta evento SpinResult
      wheelContract.once("SpinResult", (player, prizeIndex) => {
        console.log("Vincitore:", player, prizeIndex.toString());

        const segmentDegrees = 360 / prizes.length;
        const targetRotation = -(
          prizeIndex * segmentDegrees +
          segmentDegrees / 2 +
          360 * 5
        );
        wheelRef.current?.spin(targetRotation);

        const winnerPrize = prizes[prizeIndex];
        setWinner(winnerPrize);
        alert(`Hai vinto: ${winnerPrize.prize.props.children}`);
        setIsSpinning(false);
      });

      // Chiama spinWheel
      const tx = await wheelContract.spinWheel();
      await tx.wait();
      console.log("Transazione completata");

      // Animazione ruota temporanea
      let rotation = 0;
      const interval = setInterval(() => {
        rotation += 20;
        if (wheelRef.current) wheelRef.current.spin(rotation);
      }, 50);
      setTimeout(() => clearInterval(interval), 5000);
    } catch (err) {
      console.error("Errore durante lo spin:", err);
      alert("Errore durante lo spin");
      setIsSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10 gap-6 bg-gray-900 min-h-screen p-4">
      {winner && (
        <h2 className="text-2xl font-bold text-yellow-400">
          🎉 Hai vinto: {winner.prize.props.children} 🎉
        </h2>
      )}
      <h2 className="text-2xl font-bold text-white">🎯 Gira la Ruota!</h2>

      <WheelOfFortune
        ref={wheelRef}
        prizes={prizes}
        wheelPointer={<PointerIcon />}
        wheelSpinButton={
          <SpinButton onClick={spinWheel} disabled={isSpinning} />
        }
        wheelBorderColor="#222"
        onSpinEnd={handleSpinEnd}
        animationDurationInMs={5000}
        useProbabilitiesToCalculateWinner={false}
        className="w-full max-w-sm aspect-square relative flex justify-center items-center"
      />
    </div>
  );
}
