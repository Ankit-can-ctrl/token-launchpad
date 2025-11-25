import type { WalletContextState } from "@solana/wallet-adapter-react";
import type { PublicKey, Transaction } from "@solana/web3.js";

interface WalletSignerType {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransaction: (txs: Transaction[]) => Promise<Transaction[]>;
}
export function walletSigner(wallet: WalletContextState): WalletSignerType {
  if (!wallet.publicKey) {
    throw new Error("Wallet public not found.");
  }

  return {
    publicKey: wallet.publicKey,
    signTransaction: async (tx: Transaction) => {
      if (!wallet.signTransaction)
        throw new Error("Wallet cannot sign transaction.");
      return await wallet.signTransaction(tx);
    },
    signAllTransaction: async (txs: Transaction[]) => {
      if (!wallet.signAllTransactions)
        throw new Error("Wallet cannot sign multiple transactions.");
      return await wallet.signAllTransactions(txs);
    },
  };
}
