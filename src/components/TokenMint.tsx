import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, type Signer } from "@solana/web3.js";
import { useState } from "react";
import { toast } from "sonner";

const TokenMint = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [initialSupply, setInitialSupply] = useState<number>(100);
  const [decimals, setDecimals] = useState<number>(8);
  const [mintAddress, setMintAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [ataKey, setAtaKey] = useState<PublicKey>();

  const walletSigner: Signer = {
    publicKey: publicKey!,
    signTransaction: async (tx: Transaction) => {
      if (!signTransaction) throw new Error("Wallet not connected.");
      return await signTransaction(tx);
    },
    signAllTransactions: async (txs: Transaction[]) => {
      if (!signTransaction) throw new Error("Wallet not connected.");
      return await Promise.all(txs.map((tx) => signTransaction(tx)));
    },
  };

  const createToken = async () => {
    if (!publicKey) return toast.error("Connect your wallet.");

    try {
      setLoading(true);
      toast.success("creating token.");
      const payer = Keypair.generate();
      // create mint
      const mint = await createMint(
        connection,
        walletSigner,
        publicKey,
        null,
        decimals
      ); //this returns mints publicKey
      // create ata
      const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint, //mints publickey
        publicKey //owner
      );

      if (ata) {
        setAtaKey(ata.address);
      }

      const amount = initialSupply * 10 ** decimals;

      await mintTo(connection, payer, mint, ata.address, publicKey, amount);

      setMintAddress(mint.toBase58());
      toast.success("Token created succesfully.");
    } catch (error) {
      console.log("Create token error :", error);
      toast.error("Something went wrong while creating token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p>
        Your Public Key :{" "}
        {publicKey ? publicKey?.toString() : "Connect your wallet first."}
      </p>
      <p>
        ATA address :{" "}
        {loading
          ? "Loading..."
          : ataKey
          ? ataKey?.toString()
          : "create token to get your ata address"}
      </p>
      <p>
        mint address :{" "}
        {loading
          ? "Loading..."
          : mintAddress
          ? mintAddress?.toString()
          : "create token to get your ata address"}
      </p>
      <button onClick={createToken}>create token</button>
    </div>
  );
};

export default TokenMint;
