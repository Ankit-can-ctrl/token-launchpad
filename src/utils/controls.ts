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
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>
) => {
  if (!publicKey) {
    toast.error("Connect your wallet.");
    return;
  }
  const mintPubKey = new PublicKey(mintKey);

  const ix = createSetAuthorityInstruction(
    mintPubKey,
    publicKey,
    AuthorityType.MintTokens,
    null // can also add new authority public Key
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
