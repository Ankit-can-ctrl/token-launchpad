import { PublicKey } from "@solana/web3.js";

export async function fetchCreatedToken(walletPublicKey: PublicKey) {
  if (!walletPublicKey) return [];

  const response = await fetch(import.meta.env.VITE_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "my-id",
      method: "searchAssets",
      params: {
        ownerAddress: walletPublicKey.toBase58(),
        tokenType: "fungible",
      },
    }),
  });
  const data = await response.json();
  console.log("Data", data);
  return data.result?.items || [];
}
