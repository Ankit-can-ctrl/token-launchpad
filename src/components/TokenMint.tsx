import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptAccount,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
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

  const createToken = async () => {
    if (!publicKey) return toast.error("Connect your wallet.");
    if (!signTransaction) return toast.error("Connect your wallet.");
    try {
      setLoading(true);
      toast.success("creating token.");

      // Generate a new keypair for mint account
      const mintKeypair = Keypair.generate();

      // get min lamports
      const lamports = await getMinimumBalanceForRentExemptAccount(connection);

      // Derive ata address
      const ata = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey
      );

      const amount = initialSupply * 10 ** decimals;

      // build transaction with all instructions
      const transaction = new Transaction().add(
        // 1. create mint account
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        // 2. Initial mint
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          publicKey,
          null
        ),
        // 3. create associate token account
        createAssociatedTokenAccountInstruction(
          publicKey,
          ata,
          publicKey,
          mintKeypair.publicKey
        ),
        // 4. Mint tokens to ata
        createMintToInstruction(mintKeypair.publicKey, ata, publicKey, amount)
      );

      // set recent blockhash and fee payer
      transaction.feePayer = publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      // partial sign with minKeypair (has secretKey)
      transaction.partialSign(mintKeypair);

      // let wallet sign (no secretKey only signTransaction)
      const signedTx = await signTransaction(transaction);

      // send and confirm
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );
      await connection.confirmTransaction(signature, "confirmed");

      setAtaKey(ata);
      setMintAddress(mintKeypair.publicKey.toBase58());
      toast.success("Token created successfully.");
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
