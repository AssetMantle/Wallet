// import { wallets as compass } from "@cosmos-kit/compass";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation-extension";
import { wallets as exodus } from "@cosmos-kit/exodus";
import { wallets as frontier } from "@cosmos-kit/frontier";
import { wallets as keplrWallets } from "@cosmos-kit/keplr-extension";
import { wallets as leapWallets } from "@cosmos-kit/leap-extension";
import { wallets as ledger } from "@cosmos-kit/ledger";
import { wallets as okxwallet } from "@cosmos-kit/okxwallet-extension";
import { ChainProvider } from "@cosmos-kit/react";
import { wallets as shell } from "@cosmos-kit/shell-extension";
import { wallets as station } from "@cosmos-kit/station";
import { wallets as trust } from "@cosmos-kit/trust-extension";
import { wallets as vectisWallets } from "@cosmos-kit/vectis";
import { wallets as xdefi } from "@cosmos-kit/xdefi";
import { Web3Modal } from "@web3modal/react";
import { assets, chains } from "chain-registry";
import Head from "next/head";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import { SWRConfig } from "swr";
import { WagmiConfig } from "wagmi";
import Layout from "../components/Layout";
import {
  defaultChainRESTProxy,
  defaultChainRESTProxy2,
  defaultChainRPCProxy,
  defaultChainRPCProxy2,
  defaultToastContainerId,
  gravityChainRESTProxy,
  gravityChainRESTProxy2,
  gravityChainRPCProxy,
  gravityChainRPCProxy2,
  mantleAssetConfig,
  mantleChainConfig,
  mantleTestChainConfig,
  mantleTestnetAssetConfig,
} from "../config";
import "@interchain-ui/react/styles";
import "../config/styles/index.scss";
import { ethereumClient, wagmiClient, walletConnectProjectID } from "../data";
import { getSigningGravityClientOptions } from "../modules";
import ConnectModal from "../views/ConnectModal/ConnectModal";

function CreateCosmosApp({ Component, pageProps }) {
  // useEffect for bootstrap js hydration
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.js");
  }, []);

  const chainList = chains.filter(
    (chain) => chain.chain_name !== "assetmantle"
  );

  // const chainList = chains;

  const finalChains = [
    ...mantleChainConfig,
    ...chainList,
    ...mantleTestChainConfig,
  ];

  const customAssets = assets.filter(
    (assets) => assets.chain_name !== "assetmantle"
  );

  const finalAssets = [
    ...customAssets,
    ...mantleAssetConfig,
    ...mantleTestnetAssetConfig,
  ];

  // get custom signing options for the stargate client
  // construct signer options
  const signerOptions = {
    signingStargate: (chain) => {
      // return corresponding stargate options or undefined
      switch (chain.chain_name) {
        case "gravitybridge":
          return getSigningGravityClientOptions();
      }
    },
  };

  // implement session options
  const sessionOptions = {
    killOnTabClose: true,
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="AssetMantle is a community-first platform for NFT creators and collectors. Use AssetMantle to create your own NFT store or to expand your collection of NFTs."
        />
        <title>MantleWallet</title>
        {/* PWA primary color */}
        <meta name="theme-color" content="#111111" />
        {/* open graphs start */}
        <meta property="og:site_name" content="AssetMantle" />
        <meta property="og:url" content="https://assetmantle.one" />
        <meta property="al:web:url" content="https://assetmantle.one" />
        <meta property="og:image" content="/socialTagCard.png" />
        <meta property="og:title" content="AssetMantle" />
        <meta
          property="og:description"
          content="AssetMantle is a community-first platform for NFT creators and collectors. Use AssetMantle to create your own NFT store or to expand your collection of NFTs."
        />
        {/* open graphs end */}
      </Head>
      <SWRConfig value={{ fallback: { selectedIncentive: 0 } }}>
        <ChainProvider
          chains={finalChains}
          assetLists={finalAssets}
          wallets={[
            keplrWallets[0],
            ...leapWallets,
            cosmostationWallets[0],
            ...vectisWallets,
            // ...compass,
            ...exodus,
            ...frontier,
            ...ledger,
            ...okxwallet,
            ...shell,
            ...station,
            ...trust,
            ...xdefi,
          ]}
          // wallets={wallets}
          signerOptions={signerOptions}
          sessionOptions={sessionOptions}
          // walletConnectOptions={{
          //   signClient: {
          //     projectId: walletConnectProjectID,
          //     relayUrl: "wss://relay.walletconnect.org",
          //   },
          // }}
          endpointOptions={{
            assetmantle: {
              rpc: [defaultChainRPCProxy, defaultChainRPCProxy2],
              rest: [defaultChainRESTProxy, defaultChainRESTProxy2],
            },
            gravitybridge: {
              rpc: [gravityChainRPCProxy, gravityChainRPCProxy2],
              rest: [gravityChainRESTProxy, gravityChainRESTProxy2],
            },
          }}
          // walletModal={"simple_v1"}
          walletModal={ConnectModal}
        >
          <WagmiConfig client={wagmiClient}>
            <Layout>
              <Component {...pageProps} />
              <Web3Modal
                projectId={walletConnectProjectID}
                themeColor="orange"
                themeBackground="themeColor"
                themeZIndex="99999"
                ethereumClient={ethereumClient}
              />
              <ToastContainer
                position="bottom-center"
                autoClose={8000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                containerId={defaultToastContainerId}
              />
              <ToastContainer />{" "}
            </Layout>
          </WagmiConfig>
        </ChainProvider>
      </SWRConfig>
    </>
  );
}

export default CreateCosmosApp;
