import {
  AuthorityType,
  createSetAuthorityInstruction,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { toast } from "sonner";

export const revokeMintAuthority = async (
  mintKey: string,
  connection: Connection,
  publicKey: PublicKey,
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
  newMintAuthority?: string | null
) => {
  if (!publicKey) {
    toast.error("Connect your wallet.");
    return;
  }
  const mintPubKey = new PublicKey(mintKey);
  const newAuthority =
    newMintAuthority === null || newMintAuthority === undefined
      ? null
      : new PublicKey(newMintAuthority);

  const ix = createSetAuthorityInstruction(
    mintPubKey,
    publicKey,
    AuthorityType.MintTokens,
    newAuthority
  );

  const tx = new Transaction();
  tx.add(ix);
  tx.feePayer = publicKey;

  const latestBlockhash = await connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockhash.blockhash;

  // request wallet signature
  const signature = await sendTransaction(tx, connection);
  console.log(signature);
};
