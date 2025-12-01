import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import TokenDashboard from "../components/TokenDashboard";
import UpdateToken from "../components/UpdateToken";
import { fetchCreatedToken } from "../utils/getAccountToken";

export interface TokenInfo {
  id: string;
  [key: string]: any;
}

const ManageToken = ({
  setManageToken,
}: {
  setManageToken: (show: boolean) => void;
}) => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [isFetchingTokens, setIsFetchingTokens] = useState(false);

  useEffect(() => {
    async function fetchTokens() {
      if (!publicKey) return;
      setIsFetchingTokens(true);
      try {
        const mints = await fetchCreatedToken(publicKey);
        setTokens(mints);
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch tokens.");
      } finally {
        setIsFetchingTokens(false);
      }
    }
    fetchTokens();
  }, [publicKey]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <>
      {/* Global Sketch Styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Architects+Daughter&display=swap');
          
          .sketch-font {
            font-family: 'Caveat', cursive;
          }
          
          .sketch-alt-font {
            font-family: 'Architects Daughter', cursive;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(-1deg); }
            50% { transform: translateY(-5px) rotate(1deg); }
          }
          
          .sketch-box {
            position: relative;
            background: #fffef9;
            border: 2.5px solid #2d2d2d;
            border-radius: 3px 8px 5px 10px;
            box-shadow: 
              3px 3px 0 #2d2d2d,
              inset 0 0 30px rgba(0,0,0,0.02);
            transform: rotate(-0.3deg);
            transition: all 0.2s ease;
          }
          
          .sketch-box:hover {
            transform: rotate(0deg) scale(1.01);
            box-shadow: 
              4px 4px 0 #2d2d2d,
              inset 0 0 30px rgba(0,0,0,0.02);
          }
          
          .sketch-input {
            background: transparent;
            border: none;
            border-bottom: 2px dashed #888;
            font-family: 'Architects Daughter', cursive;
            font-size: 1rem;
            color: #2d2d2d;
            padding: 8px 4px;
            width: 100%;
            transition: all 0.2s;
          }
          
          .sketch-input:focus {
            outline: none;
            border-bottom: 2.5px solid #2d2d2d;
            background: rgba(255, 235, 150, 0.15);
          }
          
          .sketch-input::placeholder {
            color: #aaa;
            font-style: italic;
          }
          
          .sketch-select {
            background: #fffef9;
            border: 2px dashed #888;
            border-radius: 4px 8px 6px 10px;
            font-family: 'Architects Daughter', cursive;
            font-size: 1rem;
            color: #2d2d2d;
            padding: 10px 12px;
            width: 100%;
            cursor: pointer;
            transition: all 0.2s;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232d2d2d' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
          }
          
          .sketch-select:focus {
            outline: none;
            border: 2.5px solid #2d2d2d;
          }
          
          .sketch-button {
            font-family: 'Caveat', cursive;
            font-size: 1.5rem;
            font-weight: 600;
            background: #2d2d2d;
            color: #fffef9;
            border: 2.5px solid #2d2d2d;
            border-radius: 5px 12px 8px 15px;
            padding: 12px 32px;
            cursor: pointer;
            position: relative;
            transition: all 0.15s ease;
            box-shadow: 4px 4px 0 #888;
          }
          
          .sketch-button:hover:not(:disabled) {
            transform: translate(-2px, -2px);
            box-shadow: 6px 6px 0 #888;
          }
          
          .sketch-button:active:not(:disabled) {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0 #888;
          }
          
          .sketch-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .sketch-label {
            font-family: 'Caveat', cursive;
            font-size: 1.3rem;
            font-weight: 500;
            color: #555;
            margin-bottom: 4px;
            display: block;
          }
          
          .paper-bg {
            background-color: #fffef9;
            background-image: 
              linear-gradient(#e8e8e8 1px, transparent 1px);
            background-size: 100% 28px;
          }
          
          .upload-zone {
            border: 3px dashed #888;
            border-radius: 8px 15px 12px 20px;
            background: repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(0,0,0,0.02) 10px,
              rgba(0,0,0,0.02) 20px
            );
            transition: all 0.2s;
            cursor: pointer;
          }
          
          .upload-zone:hover {
            border-color: #2d2d2d;
            background: rgba(255, 235, 150, 0.1);
          }
          
          .sketch-title {
            position: relative;
            display: inline-block;
          }
          
          .sketch-title::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: -5px;
            right: -5px;
            height: 12px;
            background: rgba(255, 235, 100, 0.5);
            z-index: -1;
            transform: rotate(-1deg);
            border-radius: 2px;
          }
          
          .floating {
            animation: float 4s ease-in-out infinite;
          }
          
          .current-image-box {
            background: #fffef9;
            border: 2px solid #2d2d2d;
            border-radius: 8px 12px 10px 14px;
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          
          .current-image-box img {
            border: 2px dashed #888;
            border-radius: 8px 12px 10px 14px;
          }
          
          .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #888;
            border-radius: 50%;
            border-top-color: #2d2d2d;
            animation: spin 0.8s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .manage-navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
            padding: 16px 24px;
            display: flex;
            justify-content: flex-end;
            pointer-events: none;
          }
          
          .back-button {
            pointer-events: auto;
            font-family: 'Caveat', cursive;
            font-size: 1.2rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #fffef9;
            color: #2d2d2d;
            border: 2.5px solid #2d2d2d;
            border-radius: 6px 14px 10px 16px;
            padding: 10px 20px;
            box-shadow: 4px 4px 0 #2d2d2d;
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }

          .back-button:hover {
            transform: translate(-2px, -2px);
            box-shadow: 6px 6px 0 #2d2d2d;
          }

          .back-button:active {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0 #2d2d2d;
          }
        `}
      </style>

      <div className="min-h-screen paper-bg py-8 px-4 relative overflow-hidden">
        {/* Floating decorative shapes */}
        <div className="absolute top-20 right-20 w-16 h-16 border-2 border-dashed border-gray-300 rounded-full floating opacity-30" />
        <div
          className="absolute bottom-40 left-16 w-12 h-12 border-2 border-gray-300 floating opacity-30"
          style={{
            animationDelay: "1s",
            borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
          }}
        />

        {/* Navbar with Back Button */}
        <nav className="manage-navbar">
          <button onClick={() => setManageToken(false)} className="back-button">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Launchpad</span>
          </button>
        </nav>

        <div className="max-w-5xl mx-auto relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="sketch-alt-font text-sm text-gray-500 tracking-wider">
                ~ token manager ~
              </span>
            </div>
            <h1 className="sketch-font text-5xl font-bold text-gray-800 mb-2">
              <span className="sketch-title">Manage Your Token</span>
            </h1>
            <p className="sketch-alt-font text-gray-500 text-lg">
              select a token and manage its properties ✨
            </p>
          </div>

          {/* Token Selector */}
          <div
            className="sketch-box p-6 mb-8 max-w-md mx-auto"
            style={{ transform: "rotate(0.3deg)" }}
          >
            <label className="sketch-label">select your token</label>
            {isFetchingTokens ? (
              <div className="flex items-center gap-3 py-4">
                <span className="loading-spinner" />
                <span className="sketch-alt-font text-gray-500">
                  Loading your tokens...
                </span>
              </div>
            ) : tokens.length === 0 ? (
              <div className="py-4 text-center">
                <p className="sketch-alt-font text-gray-500">
                  No tokens found for this wallet
                </p>
              </div>
            ) : (
              <select
                className="sketch-select"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
              >
                <option value="">Choose a token...</option>
                {tokens.map((token) => (
                  <option key={token.id} value={token.id}>
                    {truncateAddress(token.id)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Child Components */}
          {selectedToken && (
            <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
              <UpdateToken selectedToken={selectedToken} />
              <TokenDashboard selectedToken={selectedToken} />
            </div>
          )}

          {/* Empty State */}
          {!selectedToken && !isFetchingTokens && tokens.length > 0 && (
            <div className="text-center py-12">
              <p className="sketch-alt-font text-gray-400 text-lg">
                ☝️ Select a token above to get started
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="sketch-alt-font text-sm text-gray-400">
              powered by solana • sketched with ♡
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageToken;
