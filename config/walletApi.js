import { Secp256k1HdWallet } from "@cosmjs/amino";
import { stringToPath } from "@cosmjs/crypto";
import { LedgerSigner } from "@cosmjs/ledger-amino";
import { WalletStatus } from "@cosmos-kit/core";
import { useChain, useManager } from "@cosmos-kit/react";
import crypto from "crypto";
import { useEffect } from "react";
import useSwr from "swr";
import { getChainIdFromChainName, getPrefixFromChainName } from "../lib";
import { fastRefreshInterval } from "./defaults";
import { connectLedger } from "./ledgerApi";

export const makeHdPath = (
  accountNumber = "0",
  addressIndex = "0",
  coinType = "118"
) => {
  const hdString = stringToPath(
    "m/44'/" + coinType + "'/" + accountNumber + "'/0/" + addressIndex
  );
  console.log("hdString: ", hdString);

  return hdString;
};

export const mnemonicWalletWithPassphrase = async (
  chainNameArg,
  mnemonic,
  passphrase,
  accountNumber = "0",
  addressIndex = "0"
) => {
  console.log(
    "accountNumber: ",
    accountNumber,
    " addressIndex: ",
    addressIndex,
    " chainNameArg: ",
    chainNameArg
  );

  const accountNumberArg = accountNumber?.length > 0 ? accountNumber : "0";
  const addressIndexArg = addressIndex?.length > 0 ? addressIndex : "0";

  const chainPrefix = getPrefixFromChainName(chainNameArg);
  const hdPath = makeHdPath(accountNumberArg, addressIndexArg);
  console.log("hdPath: ", hdPath, " addressIndexArg: ", addressIndexArg);
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: chainPrefix,
    bip39Password: passphrase,
    hdPaths: [hdPath],
  });
  const [firstAccount] = await wallet?.getAccounts?.();
  return { keystoreWallet: wallet, keystoreAddress: firstAccount.address };
};

export const mnemonicTrim = (mnemonic) => {
  let mnemonicList = mnemonic.replace(/\s/g, " ").split(/\s/g);
  let mnemonicWords = [];
  for (let word of mnemonicList) {
    if (word === "") {
      throw Error("Invalid Mnemonic generated");
    } else {
      let trimmedWord = word.replace(/\s/g, "");
      mnemonicWords.push(trimmedWord);
    }
  }
  mnemonicWords = mnemonicWords.join(" ");
  return mnemonicWords;
};

export const mnemonicWallet = async (chainNameArg) => {
  const prefix = getPrefixFromChainName(chainNameArg);
  const wallet = await Secp256k1HdWallet.generate(24, {
    prefix: prefix,
    hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
  });
  const [firstAccount] = await wallet.getAccounts();
  return { keystoreWallet: wallet, keystoreAddress: firstAccount.address };
};

export const decryptStore = (fileData, password) => {
  console.log(
    "inside decryptStore, fileData: ",
    fileData,
    " password: ",
    password
  );
  let hashpwd = fileData.hashpwd;
  let iv = fileData.iv;
  let salt = fileData.salt;
  let crypted = fileData.crypted;

  if (hashpwd === crypto.createHash("sha512").update(password).digest("hex")) {
    let ivText = Buffer.from(iv, "hex");
    let encryptedText = Buffer.from(crypted, "hex");

    let decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(salt, "hex"),
      ivText
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted?.toString?.();
  } else {
    throw new Error("IncorrectKeystorePassword" + " " + password);
  }
};

export const useCompositeWallet = (chainName) => {
  // get the cosmos kit wallet hook
  const {
    address: cosmosKitAddress,
    chain: cosmosKitChain,
    wallet: cosmosKitWallet,
    status: cosmosKitStatus,
    message: cosmosKitMessage,
    username: cosmosKitUsername,
    getOfflineSignerDirect: cosmosKitGetOfflineSignerDirect,
    openView: cosmosKitOpenView,
    closeView: cosmosKitCloseView,
    disconnect: cosmosKitDisconnect,
  } = useChain(chainName);

  // create the wallet name and type context hooks

  const { data: stateLedgerTransport, mutate: mutateStateLedgerTransport } =
    useSwr("stateLedgerTransport");

  const { data: stateKeystoreJson, mutate: mutateStateKeystoreJson } =
    useSwr("stateKeystoreJson");

  let ledgerTransport;

  const disconnectCompositeWallet = async () => {
    let disconnectedCompositeWallet = {
      ...zeroCompositeWallet,
    };

    console.log(
      "inside disconnectCompositeWallet: ",
      " cosmosKitDisconnect?.(): ",
      cosmosKitDisconnect,
      "disconnectedCompositeWallet: ",
      disconnectedCompositeWallet,
      " initialCompositeWallet: ",
      initialCompositeWallet
    );

    switch (initialCompositeWallet?.walletType) {
      case "cosmosKit":
        console.log("inside cosmosKit switch case");
        // connect to the cosmos kit wallet
        cosmosKitDisconnect?.();
        // mutate the composite wallet to init state
        mutateInitialCompositeWallet(disconnectedCompositeWallet);
        break;

      case "ledger":
        mutateStateLedgerTransport(null);
        // mutate the composite wallet to init state
        mutateInitialCompositeWallet(disconnectedCompositeWallet);
        break;

      case "keystore":
        // mutate the composite wallet to init state
        console.log("inside switch case keystore of disconnectcompositewallet");
        mutateStateKeystoreJson(null);
        mutateInitialCompositeWallet(disconnectedCompositeWallet);
        break;

      case "generateonly":
        // mutate the composite wallet to init state
        mutateInitialCompositeWallet(disconnectedCompositeWallet);
        break;

      default:
        console.info("CompositeWallet already disconnected");
        break;
    }
  };

  // implement the composite connect function
  const connectCompositeWallet = async (walletTypeArg, walletNameArg) => {
    console.log(
      "inside connectCompositeWallet, walletTypeArg: ",
      walletTypeArg,
      " walletNameArg: ",
      walletNameArg
    );

    await disconnectCompositeWallet();

    switch (walletTypeArg) {
      case "cosmosKit":
        try {
          // connect to the cosmos kit wallet
          walletRepo?.connect(walletNameArg);
          // set the new composite wallet state after populating wallet properties
          mutateInitialCompositeWallet({
            ...initialCompositeWallet,
            walletName: walletNameArg,
            walletType: walletTypeArg,
            status: WalletStatus.Connecting,
          });
        } catch (error) {
          console.log(
            "Error during connectCompositeWallet of cosmosKit: ",
            error
          );
          mutateInitialCompositeWallet({
            ...initialCompositeWallet,
            walletName: walletNameArg,
            walletType: walletTypeArg,
            status: WalletStatus.Error,
            message: error?.message,
          });
        }

        break;

      case "ledger":
        const ledgerChainId = getChainIdFromChainName(chainName);
        try {
          // set the connecting state
          mutateInitialCompositeWallet({
            ...initialCompositeWallet,
            status: WalletStatus?.Connecting,
            walletName: walletNameArg,
            walletType: walletTypeArg,
          });

          // connect to ledger transport and store it in state
          ledgerTransport = await connectLedger();
          mutateStateLedgerTransport(ledgerTransport);
        } catch (error) {
          console.error(
            "Error during connectCompositeWallet of ledger: ",
            error
          );
          if (
            error?.message
              ?.toString?.()
              ?.includes?.("TransportOpenUserCancelled")
          ) {
            mutateInitialCompositeWallet({
              ...initialCompositeWallet,
              status: WalletStatus?.Rejected,
              message: error?.message,
              chainId: ledgerChainId,
              chainName: chainName,
              walletName: walletNameArg,
              walletType: walletTypeArg,
            });
          } else {
            mutateInitialCompositeWallet({
              ...initialCompositeWallet,
              status: WalletStatus?.Error,
              message: error?.message,
              chainId: ledgerChainId,
              chainName: chainName,
              walletName: walletNameArg,
              walletType: walletTypeArg,
            });
          }
        }

        break;

      case "keystore":
        // update the rest of the wallet properties
        console.log(
          "inside keystore switch case of connectCompositeWallet walletNameArg: ",
          walletNameArg,
          " initialCompositeWallet: ",
          initialCompositeWallet
        );
        mutateInitialCompositeWallet({
          ...initialCompositeWallet,
          status: WalletStatus?.Connecting,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        });
        break;

      case "generateonly":
        // update the rest of the wallet properties
        break;

      default:
        break;
    }
  };

  const zeroCompositeWallet = {
    walletType: null,
    walletName: null,
    walletPrettyName: null,
    status: WalletStatus.Disconnected,
    message: null,
    address: null,
    chainId: null,
    chainName: chainName,
    username: null,
    signer: null,
    openWalletModal: cosmosKitOpenView,
    closeWalletModal: cosmosKitCloseView,
    connect: connectCompositeWallet,
    disconnect: disconnectCompositeWallet,
  };

  const { data: initialCompositeWallet, mutate: mutateInitialCompositeWallet } =
    useSwr(`initialCompositeWallet${chainName}`, {
      fallbackData: zeroCompositeWallet,
    });

  const populateCompositeWalletWithLedger = async (
    chainNameArg,
    walletNameArg,
    walletTypeArg,
    ledgerTransport
  ) => {
    console.log("inside populateCompositeWalletWithLedger");
    console.log("initialCompositeWallet: ", initialCompositeWallet);
    const ledgerChainId = getChainIdFromChainName(chainNameArg);

    try {
      // get signer object
      let ledgerSigner = new LedgerSigner(ledgerTransport, {
        testModeAllowed: true,
        hdPaths: [makeHdPath("0", "0")],
        prefix: getPrefixFromChainName(chainNameArg),
      });
      const [firstAccount] = await ledgerSigner.getAccounts();
      const ledgerAddress = firstAccount?.address;
      const ledgerMessage = "Ledger Connected";
      // set the connected state parameters
      return {
        ...initialCompositeWallet,
        status: WalletStatus?.Connected,
        message: ledgerMessage,
        address: ledgerAddress,
        chainId: ledgerChainId,
        chainName: chainNameArg,
        username: "Ledger",
        signer: ledgerSigner,
        walletPrettyName: "Ledger",
        walletName: walletNameArg,
        walletType: walletTypeArg,
      };
    } catch (error) {
      console.error(
        "Error during PopulateCompositeWalletWithLedger: ",
        error?.message,
        " object: ",
        {
          ...initialCompositeWallet,
          status: WalletStatus?.Error,
          message: error?.message,
          chainId: ledgerChainId,
          chainName: chainNameArg,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        },
        " initialCompositeWallet: ",
        initialCompositeWallet
      );

      if (
        error?.message?.toString?.()?.includes?.("TransportOpenUserCancelled")
      ) {
        return {
          ...initialCompositeWallet,
          status: WalletStatus?.Rejected,
          message: error?.message,
          chainId: ledgerChainId,
          chainName: chainNameArg,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        };
      } else {
        return {
          ...initialCompositeWallet,
          status: WalletStatus?.Error,
          message: error?.message,
          chainId: ledgerChainId,
          chainName: chainNameArg,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        };
      }
    }
  };

  const populateCompositeWalletWithKeystore = async (
    chainNameArg,
    walletNameArg,
    walletTypeArg,
    stateKeystoreJsonArg
  ) => {
    console.log("inside populateCompositeWalletWithKeystore");
    console.log(
      "initialCompositeWallet: ",
      initialCompositeWallet,
      " stateKeystoreJsonArg: ",
      stateKeystoreJsonArg
    );
    const keystoreChainId = getChainIdFromChainName(chainNameArg);

    try {
      // get signer object
      if (!stateKeystoreJsonArg) throw Error("KeystoreSelectCancelled");
      const keystoreMnemonicUntrimmed = decryptStore(
        stateKeystoreJsonArg?.keystoreJson,
        stateKeystoreJsonArg?.keystorePassword
      );

      // trim the mnemonic of any random leading or trailing spaces
      const keystoreMnemonic = mnemonicTrim(keystoreMnemonicUntrimmed);
      console.log("keystoreMnemonic: ", keystoreMnemonic);

      const { keystoreAddress, keystoreWallet } =
        await mnemonicWalletWithPassphrase(
          chainNameArg,
          keystoreMnemonic,
          stateKeystoreJsonArg?.passphrase,
          stateKeystoreJsonArg?.accountNumber,
          stateKeystoreJsonArg?.addressIndex
        );
      const keystoreMessage = "Keystore Connected";

      console.log(
        "keystoreWallet: ",
        keystoreWallet,
        " keystoreAddress: ",
        keystoreAddress
      );

      // set the connected state parameters
      return {
        ...initialCompositeWallet,
        status: WalletStatus?.Connected,
        message: keystoreMessage,
        address: keystoreAddress,
        chainId: keystoreChainId,
        chainName: chainNameArg,
        username: "Keystore",
        signer: keystoreWallet,
        walletPrettyName: "Keystore",
        walletName: walletNameArg,
        walletType: walletTypeArg,
      };
    } catch (error) {
      console.error(
        "Error during PopulateCompositeWalletWithKeystore: ",
        error?.message,
        " initialCompositeWallet: ",
        initialCompositeWallet
      );

      if (
        error?.message?.toString?.()?.includes?.("IncorrectKeystorePassword")
      ) {
        /*    mutateInitialCompositeWallet({
          ...initialCompositeWallet,
          status: WalletStatus?.Rejected,
          message: error?.message,
          chainId: keystoreChainId,
          chainName: chainNameArg,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        }); */
        return {
          ...initialCompositeWallet,
          status: WalletStatus?.Rejected,
          message: error?.message,
          chainId: keystoreChainId,
          chainName: chainNameArg,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        };
      } else {
        /* mutateInitialCompositeWallet({
          ...initialCompositeWallet,
          status: WalletStatus?.Error,
          message: error?.message,
          chainId: keystoreChainId,
          chainName: chainNameArg,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        }); */
        return {
          ...initialCompositeWallet,
          status: WalletStatus?.Error,
          message: error?.message,
          chainId: keystoreChainId,
          chainName: chainNameArg,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        };
      }
    }
  };

  const populateCompositeWalletWithCosmosKit = async (
    chainNameArg,
    walletNameArg,
    walletTypeArg,
    cosmosKitWallet,
    cosmosKitStatus,
    cosmosKitMessage,
    cosmosKitAddress,
    cosmosKitChain,
    cosmosKitUsername
  ) => {
    const cosmosKitChainId = getChainIdFromChainName(chainNameArg);
    let customCompositeWalletObject = {};
    customCompositeWalletObject.walletPrettyName = cosmosKitWallet?.prettyName;
    customCompositeWalletObject.status = cosmosKitStatus;
    customCompositeWalletObject.message = cosmosKitMessage;
    customCompositeWalletObject.address = cosmosKitAddress;
    customCompositeWalletObject.chainId = cosmosKitChain?.chain_id;
    customCompositeWalletObject.chainName = chainNameArg;
    customCompositeWalletObject.username = cosmosKitUsername;
    customCompositeWalletObject.walletName = walletNameArg;
    customCompositeWalletObject.walletType = walletTypeArg;
    try {
      customCompositeWalletObject.signer =
        await cosmosKitGetOfflineSignerDirect?.();
      return {
        ...initialCompositeWallet,
        ...customCompositeWalletObject,
      };
    } catch (error) {
      console.error(
        "Error during populateCompositeWalletWithCosmosKit: ",
        error?.message,
        " cosmosKitStatus: ",
        cosmosKitStatus
      );
      if (
        error?.message?.toString?.()?.includes?.("TransportOpenUserCancelled")
      ) {
        return {
          ...initialCompositeWallet,
          status: WalletStatus?.Rejected,
          message: error?.message,
          chainId: cosmosKitChainId,
          chainName: chainNameArg,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        };
      } else {
        return {
          ...initialCompositeWallet,
          status: WalletStatus?.Error,
          message: error?.message,
          chainId: cosmosKitChainId,
          chainName: chainNameArg,
          walletName: walletNameArg,
          walletType: walletTypeArg,
        };
      }
    }
  };

  // get walletRepo for connect function of cosmos kit
  const { getWalletRepo } = useManager();
  const walletRepo = getWalletRepo(chainName);

  // useEffect to populate context hooks on load
  useEffect(() => {
    console.log("inside useEffect:  cosmosKitStatus: ", cosmosKitStatus);
    if (cosmosKitStatus == WalletStatus.Connected) {
      cosmosKitDisconnect?.();
    }
  }, []);

  const fetchCompositeWallet = async ([
    url,
    chainNameArg,
    walletStatusArg,
    stateLedgerTransportArg,
    stateKeystoreJsonArg,
  ]) => {
    console.log(
      "inside fetchCompositeWallet initialCompositeWallet",
      initialCompositeWallet
    );
    let newCompositeWalletObject = { ...initialCompositeWallet };
    let walletTypeArg = initialCompositeWallet?.walletType;
    let walletNameArg = initialCompositeWallet?.walletName;

    if (
      walletStatusArg == WalletStatus.Connected ||
      walletStatusArg == WalletStatus.Connecting
    ) {
      switch (walletTypeArg) {
        case "cosmosKit":
          try {
            // collect the wallet parameters from cosmos kit
            newCompositeWalletObject = populateCompositeWalletWithCosmosKit(
              chainNameArg,
              walletNameArg,
              walletTypeArg,
              cosmosKitWallet,
              cosmosKitStatus,
              cosmosKitMessage,
              cosmosKitAddress,
              cosmosKitChain,
              cosmosKitUsername
            );
          } catch (error) {
            console.error(`swr fetcher : url: ${url},  error: ${error}`);
            throw error;
          }
          break;

        case "ledger":
          console.log("inside ledger switch case");
          try {
            // collect the wallet parameters from cosmos kit
            if (
              stateLedgerTransport &&
              walletStatusArg == WalletStatus.Connecting
            ) {
              // execute the populate function
              newCompositeWalletObject =
                await populateCompositeWalletWithLedger(
                  chainNameArg,
                  walletNameArg,
                  walletTypeArg,
                  stateLedgerTransportArg
                );
            }
          } catch (error) {
            console.error(`swr fetcher : url: ${url},  error: ${error}`);
            throw error;
          }

          break;

        case "keystore":
          console.log("inside keystore switch case of fetchCompositeWallet");
          try {
            // connect to keystore and store it in state
            newCompositeWalletObject =
              await populateCompositeWalletWithKeystore(
                chainNameArg,
                walletNameArg,
                walletTypeArg,
                stateKeystoreJsonArg
              );
          } catch (error) {
            console.error(`swr fetcher : url: ${url},  error: ${error}`);
            throw error;
          }

          break;

        case "generateonly":
          console.log("inside cosmosKit switch case");
          // collect the wallet parameters from cosmos kit

          break;

        default:
          true;
      }
      // update initialCompositeWallet
      if (
        !(
          initialCompositeWallet?.address ==
            newCompositeWalletObject?.address &&
          initialCompositeWallet?.chainId ==
            newCompositeWalletObject?.chainId &&
          initialCompositeWallet?.username ==
            newCompositeWalletObject?.username &&
          initialCompositeWallet?.status == newCompositeWalletObject?.status
        )
      ) {
        mutateInitialCompositeWallet(newCompositeWalletObject);
      }
    } else {
      newCompositeWalletObject = { ...initialCompositeWallet };
    }

    console.log(
      "newCompositeWalletObject inside fetch: ",
      newCompositeWalletObject
    );

    return newCompositeWalletObject;
  };

  // implement useSwr for cached and revalidation enabled wallet data
  const { data: finalCompositeWalletObject } = useSwr(
    !!chainName
      ? // &&  (initialCompositeWallet?.status == WalletStatus.Connecting ||
        //     initialCompositeWallet?.status == WalletStatus.Disconnected)
        [
          `compositeWallet`,
          chainName,
          initialCompositeWallet?.status,
          stateLedgerTransport,
          stateKeystoreJson,
        ]
      : null,
    fetchCompositeWallet,
    {
      fallbackData: initialCompositeWallet,
      refreshInterval: fastRefreshInterval,
    }
  );

  /* console.log(
    "stateLedgerTransport: ",
    stateLedgerTransport,
    " initialCompositeWallet: ",
    initialCompositeWallet
  ); */

  return {
    compositeWallet: finalCompositeWalletObject,
    connectCompositeWallet: connectCompositeWallet,
    disconnectCompositeWallet: disconnectCompositeWallet,
  };
};

/* Note: 
since changing the rpc url from dropdown will change the configuration of all the
connected chains in the app (AssetMantle, Gravity, maybe Ethereum), hence at least 
chain_id needs to be input for each chain */
