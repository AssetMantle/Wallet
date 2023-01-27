import { ChakraProvider } from "@chakra-ui/react";
import { wallets as leapwallets } from "@cosmos-kit/leap";
import { ChainProvider } from "@cosmos-kit/react";
import { assets, chains } from "chain-registry";
import Head from "next/head";
import { useEffect } from "react";
import Layout from "../components/Layout";
import {
  cosmostationWallets,
  defaultChainRESTProxy,
  defaultChainRPCProxy,
  defaultTheme,
  gravityChainRESTProxy,
  gravityChainRPCProxy,
  keplrWallets,
} from "../config";
import "../config/styles/index.scss";
import ConnectModal from "../views/ConnectModal/ConnectModal";

function CreateCosmosApp({ Component, pageProps }) {
  // useEffect for bootstrap js hydration
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.js");
    console.log("leapwallets: ", leapwallets);
  }, []);

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

      <ChakraProvider theme={defaultTheme}>
        <ChainProvider
          chains={chains}
          assetLists={assets}
          wallets={[...keplrWallets, ...leapwallets, ...cosmostationWallets]}
          endpointOptions={{
            assetmantle: {
              rpc: [defaultChainRPCProxy],
              rest: [defaultChainRESTProxy],
            },
            gravitybridge: {
              rpc: [gravityChainRPCProxy],
              rest: [gravityChainRESTProxy],
            },
          }}
          walletModal={ConnectModal} // Provide walletModal
        >
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ChainProvider>
      </ChakraProvider>
    </>
  );
}

export default CreateCosmosApp;
