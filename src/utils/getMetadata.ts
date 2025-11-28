import type { Connection, PublicKey } from "@solana/web3.js";
import { getMetadataPDA } from "./metaplex";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

export async function fetchMetadata(connection: Connection, mint: PublicKey) {
  const metadataPDA = getMetadataPDA(mint);
  //   this gives raw metadata accounts data stored at pda of your tokens metadata
  const accountInfo = await connection.getAccountInfo(metadataPDA);
  if (!accountInfo) return null;

  //   this will decode it and give us the 1st element in the object which contains metadata
  const metadata = Metadata.deserialize(accountInfo?.data)[0];

  return {
    name: metadata.data.name.replace(/\0/g, "").trim(),
    symbol: metadata.data.symbol.replace(/\0/g, "").trim(),
    uri: metadata.data.uri.replace(/\0/g, "").trim(),
  };
}

export async function fetchOffchainMetadata(uri: string) {
  const url = uri.startsWith("ipfs://")
    ? uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
    : uri;

  const res = await fetch(url);
  return await res.json();
}
