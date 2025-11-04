import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  // 👉 Cambia questo ID con quello della chain corretta per la tua dApp
  const TARGET_CHAIN_ID = 421614; // BNB Smart Chain Mainnet
  // (per Ethereum Mainnet sarebbe 1, per Sepolia 11155111, ecc.)

  useEffect(() => {
    if (!window.ethereum) return;

    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(web3Provider);

    const loadData = async () => {
      try {
        const network = await web3Provider.getNetwork();
        setChainId(network.chainId);
        setIsCorrectNetwork(network.chainId === TARGET_CHAIN_ID);

        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          const signerInstance = web3Provider.getSigner();
          setSigner(signerInstance);
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } catch (err) {
        console.error("Wallet init error:", err);
      }
    };

    loadData();

    // 🔄 Listener per account e rete
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        setIsConnected(false);
        setAccount("");
        setSigner(null);
      } else {
        const signerInstance = web3Provider.getSigner();
        setSigner(signerInstance);
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    });

    window.ethereum.on("chainChanged", (chainHex) => {
      const newChainId = parseInt(chainHex, 16);
      setChainId(newChainId);
      setIsCorrectNetwork(newChainId === TARGET_CHAIN_ID);
      window.location.reload();
    });

    return () => {
      window.ethereum.removeAllListeners("accountsChanged");
      window.ethereum.removeAllListeners("chainChanged");
    };
  }, []);

  // 🔹 Connetti wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const signerInstance = web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(signerInstance);
      setAccount(accounts[0]);
      setChainId(network.chainId);
      setIsCorrectNetwork(network.chainId === TARGET_CHAIN_ID);
      setIsConnected(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // 🔹 Switch network (opzionale)
  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError) {
      // Se la rete non è aggiunta in MetaMask
      if (switchError.code === 4902) {
        alert(
          "This network is not available in MetaMask. Please add it manually."
        );
      } else {
        console.error("Switch network error:", switchError);
      }
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount("");
    setProvider(null);
    setSigner(null);
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isCorrectNetwork,
        account,
        provider,
        signer,
        chainId,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
