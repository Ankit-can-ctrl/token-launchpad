import { Connection, PublicKey } from "@solana/web3.js";

export async function getAccountInfo(
  connection: Connection,
  mintAddress: string
) {
  const minPubKey = new PublicKey(mintAddress);

  const accountInfo = await connection.getParsedAccountInfo(minPubKey);

  if (!accountInfo.value) {
    throw new Error("Mint not found.");
  }

  const data = accountInfo.value?.data;
  if ("parsed" in data) {
    const mintData = data.parsed.info;
    console.log(mintData);
    return mintData;
  } else {
    console.log("Raw data (Buffer):", data);
  }
}
