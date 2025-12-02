import "./LabPage.css";
import { ethers } from "ethers";
import React, { useState, useEffect, useContext } from "react";
import { WalletContext } from "./WalletContext";
import Modal from "./Modal";

/*  
  👉 QUI METTI GLI INDIRIZZI DEI 4 CONTRATTI NFT
*/
const NFT_CONTRACTS = [
  "0xEa521f642D1eE05aCA25979B7B6d7C83b24aA901",
  "0xEa521f642D1eE05aCA25979B7B6d7C83b24aA901",
  "0xEa521f642D1eE05aCA25979B7B6d7C83b24aA901",
  "0xEa521f642D1eE05aCA25979B7B6d7C83b24aA901",
];

const NFT_ABI = [
  "function publicMint() external returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function balanceOf(address owner) external view returns (uint256)",
];

const LabPage = () => {
  const {
    isConnected,
    account,
    connectWallet,
    disconnectWallet,
    provider,
    signer,
  } = useContext(WalletContext);

  const [transactionStatus, setTransactionStatus] = useState(["", "", "", ""]);
  const [isTransactionLoading, setIsTransactionLoading] = useState([
    false,
    false,
    false,
    false,
  ]);

  const [nftImages, setNftImages] = useState(["", "", "", ""]);
  const [nftDescriptions, setNftDescriptions] = useState(["", "", "", ""]);

  const [heroImage, setHeroImage] = useState("/lab_0.png");

  // 4 NFT disponibili
  const nfts = [
    {
      name: "Protron I Module",
      description: "+25% AIBTC",
      price: "FREE",
      value: ethers.utils.parseEther("0"),
    },
    {
      name: "Protron II Module",
      description: "+10% BTC",
      price: "0.02 ETH",
      value: ethers.utils.parseEther("0.02"),
    },
    {
      name: "Protron III Module",
      description: "+30% AIBTC",
      price: "0.03 ETH",
      value: ethers.utils.parseEther("0.03"),
    },
    {
      name: "Protron IV Module",
      description: "+40% AIBTC",
      price: "0.05 ETH",
      value: ethers.utils.parseEther("0.05"),
    },
  ];

  // Carica metadata di OGNI NFT dai 4 contratti
  useEffect(() => {
    const loadAllMetadata = async () => {
      if (!provider) return;

      let imgs = ["", "", "", ""];
      let descs = ["", "", "", ""];

      imgs[0] = "/aibtc_module.png";
      imgs[1] = "/btc_module.png";
      imgs[2] = "/btc_module.png";
      imgs[3] = "/meme_module.png";

      for (let i = 0; i < 4; i++) {
        try {
          const contract = new ethers.Contract(
            NFT_CONTRACTS[i],
            NFT_ABI,
            provider
          );

          const uri = await contract.tokenURI(1); // tutti gli NFT hanno stesso baseURI
          const res = await fetch(uri);
          const metadata = await res.json();

          //imgs[i] = metadata.image;
          descs[i] = metadata.description || nfts[i].description;

          //temporaneo, solo per vedere la seconda immagine senza dover deployare l nft
          // if (i === 1) {
          //   // immagine statica
          //   imgs[i] = "/btc_module.png";
          // } else {
          //   imgs[i] = metadata.image;
          // }
        } catch (e) {
          console.error("Metadata load error:", e);
        }
      }

      setNftImages(imgs);
      setNftDescriptions(descs);
    };

    loadAllMetadata();
  }, [provider]);

  // Controlla quali NFT possiede il wallet e aggiorna HERO IMAGE
  useEffect(() => {
    const updateHeroImage = async () => {
      if (!provider || !isConnected) {
        setHeroImage("/lab_0.png");
        return;
      }

      let ownedIndex = -1;

      for (let i = 0; i < 4; i++) {
        const contract = new ethers.Contract(
          NFT_CONTRACTS[i],
          NFT_ABI,
          provider
        );
        const balance = await contract.balanceOf(account);

        if (balance.toNumber() > 0) {
          ownedIndex = i;
        }
      }

      if (ownedIndex === -1) {
        setHeroImage("/lab_0.png");
      } else {
        setHeroImage(`/lab_${ownedIndex + 1}.png`);
      }
    };

    updateHeroImage();
  }, [provider, isConnected, account]);

  // MINT di un NFT
  const handleMint = async (index) => {
    if (!isConnected) {
      setTransactionStatus((prev) => {
        const up = [...prev];
        up[index] = "Please connect wallet";
        return up;
      });
      return;
    }

    setIsTransactionLoading((prev) => {
      const up = [...prev];
      up[index] = true;
      return up;
    });

    try {
      const nftContract = new ethers.Contract(
        NFT_CONTRACTS[index],
        NFT_ABI,
        signer
      );

      const tx = await nftContract.publicMint({
        value: nfts[index].value,
      });

      setTransactionStatus((prev) => {
        const up = [...prev];
        up[index] = `Transaction sent: ${tx.hash}`;
        return up;
      });

      const receipt = await tx.wait();

      setTransactionStatus((prev) => {
        const up = [...prev];
        up[index] = "Mint confirmed!";
        return up;
      });
    } catch (error) {
      console.error(error);

      setTransactionStatus((prev) => {
        const up = [...prev];
        if (error.code === 4001) up[index] = "Transaction rejected by user";
        else up[index] = `Mint failed: ${error.message}`;
        return up;
      });
    }

    setIsTransactionLoading((prev) => {
      const up = [...prev];
      up[index] = false;
      return up;
    });
  };

  const formatAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <div className="nft-page">
      <Modal />

      <div className="container">
        {/* HERO dinamico */}
        <div className="nft-hero">
          <img src={heroImage} alt="NFT Highlight" className="nft-hero-image" />
        </div>

        {/* <div className="wallet-section">
          {isConnected ? (
            <div className="wallet-connected">
              <span className="wallet-address">{formatAddress(account)}</span>
              <button className="btn btn-secondary" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div> */}

        {/* TABELLA NFT */}
        <table className="nft-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Mint</th>
            </tr>
          </thead>

          <tbody>
            {nfts.map((item, index) => (
              <tr key={index} className="nft-row">
                <td>
                  <img
                    src={nftImages[index]}
                    alt={item.name}
                    className="nft-table-image"
                  />
                </td>

                <td className="nft-table-name">{item.name}</td>
                <td className="nft-table-description">{item.description}</td>
                <td className="nft-table-price">{item.price}</td>

                <td>
                  <button
                    onClick={() => handleMint(index)}
                    className={`btn btn-primary btn-large-lab ${
                      isTransactionLoading[index] ? "loading" : ""
                    }`}
                    disabled={isTransactionLoading[index]}
                  >
                    {isTransactionLoading[index] ? "Minting..." : "Mint"}
                  </button>

                  {transactionStatus[index] && (
                    <div
                      className={`transaction-status ${
                        transactionStatus[index].includes("confirmed")
                          ? "success"
                          : "error"
                      }`}
                    >
                      {transactionStatus[index]}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabPage;
