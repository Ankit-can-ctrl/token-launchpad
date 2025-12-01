import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAccountInfo } from "../utils/getAccountInfo";
import { toast } from "sonner";
import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";

interface TokenDashboardProps {
  selectedToken: string;
}

interface MintData {
  decimals: number;
  freezeAuthority: string | null;
  isInitialized: boolean;
  mintAuthority: string | null;
  supply: string;
}

const TokenDashboard = ({ selectedToken }: TokenDashboardProps) => {
  const { connection } = useConnection();
  const [mintData, setMintData] = useState<MintData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [recipientPubKey, setRecipientPubKey] = useState("");
  const { publicKey, sendTransaction } = useWallet();
  const [checked, setChecked] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMintToken = async () => {
    try {
      setLoading(true);
      toast.message("Minting token...");
      if (!publicKey) {
        toast.error("Connect your wallet.");
        return;
      }
      const mintPubKey = new PublicKey(selectedToken);

      let otherUserKey;
      if (recipientPubKey === "") {
        otherUserKey = publicKey;
      } else {
        otherUserKey = new PublicKey(recipientPubKey);
      }

      // get or create ATA
      const ata = await getAssociatedTokenAddress(mintPubKey, otherUserKey!);

      const ataInfo = await connection.getAccountInfo(ata);

      const transaction = new Transaction();

      // if ata does not exist
      if (!ataInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            ata,
            otherUserKey,
            mintPubKey
          )
        );
      }
      if (!mintData?.decimals) {
        throw new Error("Please select a token");
      }

      transaction.add(
        createMintToInstruction(
          mintPubKey,
          ata,
          publicKey,
          tokenAmount * 10 ** mintData?.decimals
        )
      );

      const signature = await sendTransaction(transaction, connection);
      console.log(signature);
      setRefreshKey((prev) => prev + 1);
      toast.success("Token mint successfull.");
    } catch (error) {
      toast.error("something went wrong while minting token.");
      console.log("Minting more token error :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedToken) return;
      setLoading(true);
      try {
        const data = await getAccountInfo(connection, selectedToken);
        setMintData(data);
      } catch (error) {
        console.error("Error fetching mint data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [connection, selectedToken, refreshKey]);

  const formatSupply = (supply: string, decimals: number) => {
    const num = BigInt(supply);
    const divisor = BigInt(10 ** decimals);
    const whole = num / divisor;
    const remainder = num % divisor;
    return `${whole.toLocaleString()}${
      remainder > 0
        ? "." + remainder.toString().padStart(decimals, "0").replace(/0+$/, "")
        : ""
    }`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6 lg:col-span-2">
      {/* Token Details Card */}
      <div className="sketch-box p-6" style={{ transform: "rotate(0.5deg)" }}>
        {/* Card Header */}
        <div className="text-center mb-6">
          <h2 className="sketch-font text-2xl font-bold text-gray-800">
            Token Details
          </h2>
          <p className="sketch-alt-font text-gray-500 text-sm">
            on-chain token information 📊
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-8">
            <span className="loading-spinner" />
            <span className="sketch-alt-font text-gray-500">
              Loading token data...
            </span>
          </div>
        ) : !mintData ? (
          <div className="py-8 text-center">
            <p className="sketch-alt-font text-gray-400">
              Select a token to view details
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Decimals & Supply Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="sketch-label">decimals</span>
                <span className="sketch-alt-font text-2xl font-semibold text-gray-800">
                  {mintData.decimals}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="sketch-label">supply</span>
                <span className="sketch-alt-font text-2xl font-semibold text-gray-800">
                  {formatSupply(mintData.supply, mintData.decimals)}
                </span>
              </div>
            </div>

            {/* Initialized */}
            <div className="flex flex-col">
              <span className="sketch-label">initialized</span>
              <span
                className={`sketch-alt-font text-lg font-medium ${
                  mintData.isInitialized ? "text-green-600" : "text-red-500"
                }`}
              >
                {mintData.isInitialized ? "✓ Yes" : "✗ No"}
              </span>
            </div>

            {/* Mint Authority */}
            <div className="flex flex-col">
              <span className="sketch-label">mint authority</span>
              {mintData.mintAuthority ? (
                <span
                  className="sketch-alt-font text-sm text-gray-700 font-mono break-all"
                  title={mintData.mintAuthority}
                >
                  {truncateAddress(mintData.mintAuthority)}
                </span>
              ) : (
                <span className="sketch-alt-font text-sm text-gray-400 italic">
                  None (Immutable) 🔒
                </span>
              )}
            </div>

            {/* Freeze Authority */}
            <div className="flex flex-col">
              <span className="sketch-label">freeze authority</span>
              {mintData.freezeAuthority ? (
                <span
                  className="sketch-alt-font text-sm text-gray-700 font-mono break-all"
                  title={mintData.freezeAuthority}
                >
                  {truncateAddress(mintData.freezeAuthority)}
                </span>
              ) : (
                <span className="sketch-alt-font text-sm text-gray-400 italic">
                  None ❄️
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mint More Tokens Card */}
      <div className="sketch-box p-6" style={{ transform: "rotate(-0.3deg)" }}>
        {/* Card Header */}
        <div className="text-center mb-6">
          <h2 className="sketch-font text-2xl font-bold text-gray-800">
            Mint Tokens
          </h2>
          <p className="sketch-alt-font text-gray-500 text-sm">
            create more tokens ✨
          </p>
        </div>

        {/* Mint to own wallet checkbox */}
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="w-5 h-5 accent-gray-800 cursor-pointer"
              style={{
                border: "2px solid #2d2d2d",
                borderRadius: "4px",
              }}
            />
            <span className="sketch-alt-font text-gray-700">
              Mint to my own wallet
            </span>
          </label>
        </div>

        {/* Recipient Public Key */}
        <div className="mb-5">
          <label className="sketch-label">recipient's public key</label>
          <input
            type="text"
            className="sketch-input"
            placeholder="Enter wallet address..."
            value={recipientPubKey}
            onChange={(e) => setRecipientPubKey(e.target.value)}
            disabled={checked}
            style={{
              opacity: checked ? 0.5 : 1,
              cursor: checked ? "not-allowed" : "text",
            }}
          />
          {checked && (
            <p className="sketch-alt-font text-xs text-gray-400 mt-1 italic">
              disabled when minting to your own wallet
            </p>
          )}
        </div>

        {/* Token Amount */}
        <div className="mb-6">
          <label className="sketch-label">amount to mint</label>
          <input
            type="number"
            min={0}
            className="sketch-input"
            placeholder="Enter amount..."
            value={tokenAmount || ""}
            onChange={(e) => setTokenAmount(Number(e.target.value))}
          />
        </div>

        {/* Mint Button */}
        <button
          className="sketch-button w-full"
          onClick={handleMintToken}
          disabled={loading || tokenAmount <= 0}
        >
          {loading ? "⏳ Minting..." : "🪙 Mint Tokens"}
        </button>

        <p className="text-center sketch-alt-font text-sm text-gray-400 mt-3">
          tokens will be minted to {checked ? "your wallet" : "the recipient"}
        </p>
      </div>
    </div>
  );
};

export default TokenDashboard;
