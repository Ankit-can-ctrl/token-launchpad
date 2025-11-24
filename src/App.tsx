import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { Toaster } from "sonner";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import TokenMint from "./components/TokenMint";
import {
  WalletDisconnectButton,
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

const App = () => {
  return (
    <>
      <Toaster />
      <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
        <WalletProvider wallets={[]}>
          <WalletModalProvider>
            <div>
              <WalletMultiButton />
              <WalletDisconnectButton />
              <TokenMint />
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
};

export default App;
