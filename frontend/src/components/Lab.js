import "./LabPage.css";
import { ethers } from "ethers";
import React, { useState, useEffect, useContext, useMemo } from "react";
import { WalletContext } from "./WalletContext";
import Modal from "./Modal";
import { CONFIG } from "../config";

/*
  👉 QUI METTI GLI INDIRIZZI DEI 4 CONTRATTI NFT
*/
const NFT_CONTRACTS = [CONFIG.NFT1, CONFIG.NFT2, CONFIG.NFT3, CONFIG.NFT4];

const NFT_ABI = [
  "function publicMint() external returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function balanceOf(address owner) external view returns (uint256)",
];

const LabPage = () => {
  const { isConnected, account, provider, signer } = useContext(WalletContext);

  // ✅ immagini default SEMPRE disponibili (anche senza provider)
  const DEFAULT_IMAGES = useMemo(
    () => [
      "/aibtc_module.png",
      "/aibtc_gen_mod.png",
      "/aibtc_gen_mod.png",
      "/aibtc_gen_mod.png",
    ],
    [],
  );

  const [transactionStatus, setTransactionStatus] = useState(["", "", "", ""]);
  const [isTransactionLoading, setIsTransactionLoading] = useState([
    false,
    false,
    false,
    false,
  ]);

  // ✅ inizializzo già con le immagini
  const [nftImages, setNftImages] = useState(DEFAULT_IMAGES);
  const [nftDescriptions, setNftDescriptions] = useState(["", "", "", ""]);

  const [heroImage, setHeroImage] = useState("/lab_0.png");

  // 4 NFT disponibili
  const nfts = [
    {
      name: "Protron I Module",
      description: "AIBTC Rewards boost",
      price: "FREE",
      value: ethers.utils.parseEther("0"),
    },
    {
      name: "Coming Soon",
      description: "",
      price: "",
      value: ethers.utils.parseEther("0.02"),
    },
    {
      name: "Coming Soon",
      description: "",
      price: "",
      value: ethers.utils.parseEther("0.02"),
    },
    {
      name: "Coming Soon",
      description: "",
      price: "",
      value: ethers.utils.parseEther("0.02"),
    },
  ];

  // ✅ Carica metadata (descrizioni) SOLO se provider esiste
  useEffect(() => {
    const loadAllMetadata = async () => {
      // metto immagini default sempre (se per caso qualcuno le cambia altrove)
      setNftImages(DEFAULT_IMAGES);

      // se non c'è provider (incognito senza estensione) non posso chiamare tokenURI
      if (!provider) {
        // fallback: descrizioni di default dal array nfts
        setNftDescriptions(nfts.map((x) => x.description || ""));
        return;
      }

      const descs = ["", "", "", ""];

      for (let i = 0; i < 4; i++) {
        try {
          const contract = new ethers.Contract(
            NFT_CONTRACTS[i],
            NFT_ABI,
            provider,
          );

          const uri = await contract.tokenURI(1);

          const res = await fetch(uri, { cache: "no-store" });
          if (!res.ok) throw new Error(`fetch metadata failed: ${res.status}`);

          const metadata = await res.json();

          descs[i] = metadata?.description || nfts[i].description || "";
          // Se in futuro vuoi usare l'immagine on-chain:
          // imgs[i] = metadata?.image || DEFAULT_IMAGES[i];
        } catch (e) {
          console.error("Metadata load error:", e);
          descs[i] = nfts[i].description || "";
        }
      }

      setNftDescriptions(descs);
    };

    loadAllMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, DEFAULT_IMAGES]);

  // ✅ HERO dinamico (se non connesso o non c’è provider torna a lab_0)
  useEffect(() => {
    const updateHeroImage = async () => {
      if (!provider || !isConnected || !account) {
        setHeroImage("/lab_0.png");
        return;
      }

      let ownedIndex = -1;

      for (let i = 0; i < 4; i++) {
        try {
          const contract = new ethers.Contract(
            NFT_CONTRACTS[i],
            NFT_ABI,
            provider,
          );

          const balance = await contract.balanceOf(account);
          if (balance?.toNumber?.() > 0) ownedIndex = i;
        } catch (e) {
          console.error("balanceOf error:", e);
        }
      }

      setHeroImage(
        ownedIndex === -1 ? "/lab_0.png" : `/lab_${ownedIndex + 1}.png`,
      );
    };

    updateHeroImage();
  }, [provider, isConnected, account]);

  // ✅ MINT
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
        signer,
      );

      const tx = await nftContract.publicMint({
        value: nfts[index].value,
      });

      setTransactionStatus((prev) => {
        const up = [...prev];
        up[index] = `Transaction sent: ${tx.hash}`;
        return up;
      });

      await tx.wait();

      setTransactionStatus((prev) => {
        const up = [...prev];
        up[index] = "Mint confirmed!";
        return up;
      });
    } catch (error) {
      console.error(error);

      // prova a pescare il revert reason nei vari campi possibili (ethers v5/metamask)
      const rawMessage =
        error?.reason ||
        error?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "";

      // normalizza: se è del tipo 'execution reverted: XYZ' tieni solo XYZ
      let pretty = rawMessage;

      // caso comune: "execution reverted: You have already minted this NFT"
      const m1 = rawMessage.match(/execution reverted: (.*)/i);
      if (m1?.[1]) pretty = m1[1].trim();

      // caso: "reverted with reason string '...'"
      const m2 = rawMessage.match(/reason string ['"](.+?)['"]/i);
      if (m2?.[1]) pretty = m2[1].trim();

      // se l'utente rifiuta in Metamask
      if (error?.code === 4001) pretty = "Transaction rejected by user";

      // fallback super semplice se non troviamo nulla
      if (!pretty) pretty = "Mint failed";

      setTransactionStatus((prev) => {
        const up = [...prev];
        up[index] = pretty;
        return up;
      });
    }

    setIsTransactionLoading((prev) => {
      const up = [...prev];
      up[index] = false;
      return up;
    });
  };

  return (
    <div className="nft-page">
      <Modal />

      <div className="container">
        {/* HERO */}
        <div className="nft-hero">
          <img
            src={heroImage}
            alt="NFT Highlight"
            className="nft-hero-image"
            onError={(e) => {
              e.currentTarget.src = "/lab_0.png";
            }}
          />
        </div>

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
                    src={nftImages[index] || DEFAULT_IMAGES[index]}
                    alt={item.name}
                    className="nft-table-image"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMAGES[index];
                    }}
                  />
                </td>

                <td className="nft-table-name">{item.name}</td>

                {/* ✅ usa descrizione caricata (se disponibile) */}
                <td className="nft-table-description">
                  {nftDescriptions[index] || item.description}
                </td>

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

        {/* (opzionale) debug rapido */}
        {/* <pre style={{ color: "#fff" }}>
          provider: {String(!!provider)} | connected: {String(isConnected)}
        </pre> */}
      </div>
    </div>
  );
};

export default LabPage;
