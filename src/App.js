import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ColorsCollection from "./utils/ColorsCollection.json";
import openseaLogo from "./assets/OS.svg";

// Constants
const TWITTER_HANDLE = "_cophi_";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "https://testnets.opensea.io/collection/colors-v8";
const TOTAL_MINT_COUNT = 500;

const CONTRACT_ADDRESS = "0x01a1aB765928F0a6C0EFdd5A214A11fAa3B4E3E6";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalMintCount, setTotalMintCount] = useState(0);

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4";
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Rinkeby Test Network!");
    }

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  /*
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ColorsCollection.abi,
          signer
        );

        let totalMinted = await connectedContract.getTotalNFTsMintedSoFar();
        setTotalMintCount(totalMinted);
        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewColorMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
          return;
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ColorsCollection.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeColor();

        let totalMinted = await connectedContract.getTotalNFTsMintedSoFar();
        setTotalMintCount(totalMinted);
        console.log(`Total NFTs Minted: ${totalMinted}`);

        console.log("Minting...please wait.");
        setIsLoading(true);
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        setIsLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };
  /* 
  This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  const renderMintUI = () =>
    isLoading === true ? (
      <button className="cta-button connect-wallet-button">Minting..</button>
    ) : (
      <button
        onClick={askContractToMintNft}
        className="cta-button connect-wallet-button"
      >
        Mint NFT
      </button>
    );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">colors.</p>
          <p className="sub-text">100% onchain. 100% colors. </p>
          <p className="mint-count">
            {Number(totalMintCount) + 1}/{TOTAL_MINT_COUNT} NFTs minted so far
          </p>
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderMintUI()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`by @${TWITTER_HANDLE}`}</a>
        </div>
        <div className="footer-container">
          <img alt="Opensea Logo" className="opensea-logo" src={openseaLogo} />
          <a
            className="footer-text"
            href={OPENSEA_LINK}
            target="_blank"
            rel="noreferrer"
          >
            colors.
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
