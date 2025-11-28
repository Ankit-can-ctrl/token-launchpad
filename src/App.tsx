import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { Toaster } from "sonner";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import TokenMint from "./components/TokenMint";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import ManageToken from "./pages/ManageToken";

const App = () => {
  const [manageToken, setManageToken] = useState(false);
  return (
    <>
      <Toaster />
      <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
        <WalletProvider wallets={[]}>
          <WalletModalProvider>
            <div>
              {manageToken ? (
                <ManageToken setManageToken={setManageToken} />
              ) : (
                <TokenMint setManageToken={setManageToken} />
              )}
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
};

export default App;
