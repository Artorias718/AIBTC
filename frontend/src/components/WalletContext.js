import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  // ✅ Imposta la rete corretta (Arbitrum Sepolia Testnet)
  //const CORRECT_CHAIN_ID = "0x66eee"; // 421614 in decimale Arbitrum sepolia
  const CORRECT_CHAIN_ID = "0xa4b1"; // 42161 in decimale Arbitrum one

  useEffect(() => {
    if (window.ethereum) {
      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(newProvider);

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      checkConnection(newProvider);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const checkConnection = async (prov) => {
    try {
      const accounts = await prov.listAccounts();
      const network = await prov.getNetwork();
      const currentChainId = `0x${network.chainId.toString(16)}`;
      setChainId(currentChainId);

      if (accounts.length > 0) {
        setIsConnected(true);
        setAccount(accounts[0]);
        setSigner(prov.getSigner());
      }
      setIsCorrectNetwork(currentChainId === CORRECT_CHAIN_ID);
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAccount(null);
    } else {
      setIsConnected(true);
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = (newChainId) => {
    console.log("🔄 Chain changed:", newChainId);
    setChainId(newChainId);
    setIsCorrectNetwork(newChainId === CORRECT_CHAIN_ID);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await newProvider.getNetwork();
      const currentChainId = `0x${network.chainId.toString(16)}`;

      setProvider(newProvider);
      setSigner(newProvider.getSigner());
      setAccount(accounts[0]);
      setIsConnected(true);
      setChainId(currentChainId);
      setIsCorrectNetwork(currentChainId === CORRECT_CHAIN_ID);
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount(null);
    setSigner(null);
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return alert("MetaMask not detected");

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CORRECT_CHAIN_ID }],
      });
    } catch (switchError) {
      // 🧩 Se la rete non è aggiunta in MetaMask, la aggiungiamo
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: CORRECT_CHAIN_ID,
                chainName: "Arbitrum Sepolia Testnet",
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
                blockExplorerUrls: ["https://sepolia.arbiscan.io"],
              },
            ],
          });
        } catch (addError) {
          console.error("Error adding Arbitrum Sepolia:", addError);
        }
      } else {
        console.error("Error switching network:", switchError);
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        account,
        provider,
        signer,
        chainId,
        isCorrectNetwork,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
