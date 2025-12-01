import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { getAccountInfo } from "../utils/getAccountInfo";

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
  }, [connection, selectedToken]);

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
    <div className="w-full">
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

      {/* Space for other components/cards can be added here */}
    </div>
  );
};

export default TokenDashboard;
