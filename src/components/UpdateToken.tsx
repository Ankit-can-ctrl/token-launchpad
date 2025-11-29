import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useRef } from "react";
import { fetchCreatedToken } from "../utils/getAccountToken";
import { toast } from "sonner";
import { PublicKey, Transaction } from "@solana/web3.js";
import { fetchMetadata, fetchOffchainMetadata } from "../utils/getMetadata";
import { uploadImage, uploadMetadataJSON } from "../lib/pinata";
import { updateMetadataInstruction } from "../utils/metaplex";

const UpdateToken = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTokens, setIsFetchingTokens] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    async function fetchToken() {
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
    fetchToken();
  }, [publicKey]);

  useEffect(() => {
    async function loadMetadata() {
      if (!selectedToken) return;
      setIsLoading(true);
      try {
        const mintKey = new PublicKey(selectedToken);
        const onChainData = await fetchMetadata(connection, mintKey);
        if (onChainData) {
          setName(onChainData.name);
          setSymbol(onChainData.symbol);

          const offChainData = await fetchOffchainMetadata(onChainData.uri);
          setDescription(offChainData.description || "");
          if (offChainData.image) {
            setIsImageLoading(true);
            setCurrentImage(offChainData.image);
          } else {
            setCurrentImage("");
          }
        }
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong while fetching token data.");
      } finally {
        setIsLoading(false);
      }
    }
    loadMetadata();
  }, [selectedToken, connection]);

  const handleUpdate = async () => {
    if (!publicKey || !selectedToken) {
      toast.error("Please select a token.");
      return;
    }

    try {
      setIsUpdating(true);
      toast.info("Uploading metadata...");

      let imageUri = currentImage;
      if (imageFile) {
        imageUri = await uploadImage(imageFile);
      }

      const metadataUri = await uploadMetadataJSON({
        name,
        symbol,
        description,
        image: imageUri,
      });

      toast.info("Sending transaction...");

      const mintPubkey = new PublicKey(selectedToken);
      const updateIx = updateMetadataInstruction(
        mintPubkey,
        publicKey,
        name,
        symbol,
        metadataUri
      );

      const transaction = new Transaction().add(updateIx);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      toast.success("Token metadata updated!");
      setImageFile(null);
    } catch (error) {
      toast.error("Something went wrong while updating token metadata.");
      console.log(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getImageUrl = (uri: string) => {
    if (uri.startsWith("ipfs://")) {
      return uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    return uri;
  };

  return (
    <>
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
          
          .sketch-button-secondary {
            background: #fffef9;
            color: #2d2d2d;
          }
          
          .sketch-button-secondary:hover:not(:disabled) {
            background: #f5f5f0;
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

        <div className="max-w-xl mx-auto relative">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="sketch-alt-font text-sm text-gray-500 tracking-wider">
                ~ token manager ~
              </span>
            </div>
            <h1 className="sketch-font text-5xl font-bold text-gray-800 mb-2">
              <span className="sketch-title">Update Metadata</span>
            </h1>
            <p className="sketch-alt-font text-gray-500 text-lg">
              modify your token's appearance ✏️
            </p>
          </div>

          {/* Token Selector Card */}
          <div
            className="sketch-box p-6 mb-6"
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

          {/* Loading State */}
          {isLoading && selectedToken && (
            <div className="sketch-box p-8 text-center">
              <span className="loading-spinner" />
              <p className="sketch-alt-font text-gray-500 mt-4">
                Loading token metadata...
              </p>
            </div>
          )}

          {/* Edit Form */}
          {!isLoading && selectedToken && (
            <div className="sketch-box p-6 mb-6">
              {/* Current Image Display */}
              {currentImage && (
                <div className="mb-6">
                  <label className="sketch-label">current image</label>
                  <div className="current-image-box">
                    {isImageLoading && (
                      <div
                        className="w-20 h-20 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300"
                        style={{ borderRadius: "8px 12px 10px 14px" }}
                      >
                        <span className="loading-spinner" />
                      </div>
                    )}
                    <img
                      src={getImageUrl(currentImage)}
                      alt="Current token"
                      className="w-20 h-20 object-cover"
                      style={{ display: isImageLoading ? "none" : "block" }}
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => setIsImageLoading(false)}
                    />
                    <div>
                      <p className="sketch-alt-font text-gray-600 text-sm">
                        {isImageLoading
                          ? "Loading image..."
                          : "This is your token's current image"}
                      </p>
                      <p className="sketch-alt-font text-gray-400 text-xs mt-1">
                        Upload a new one below to replace it
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* New Image Upload */}
              <div className="mb-6">
                <label className="sketch-label">
                  new image{" "}
                  <span className="text-gray-400 text-sm">(optional)</span>
                </label>
                <div
                  className="upload-zone p-6 text-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setImageFile(file);
                    }}
                  />
                  {imageFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        className="w-24 h-24 object-cover border-2 border-gray-400"
                        style={{ borderRadius: "10px 20px 15px 25px" }}
                      />
                      <span className="sketch-alt-font text-gray-600">
                        {imageFile.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                        }}
                        className="sketch-alt-font text-sm text-red-500 hover:underline"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <svg
                        className="w-12 h-12 mx-auto mb-2 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="sketch-alt-font text-gray-500">
                        click to upload new image
                      </p>
                      <p className="sketch-alt-font text-sm text-gray-400 mt-1">
                        PNG, JPG, GIF, WEBP
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Token Name */}
              <div className="mb-5">
                <label className="sketch-label">token name</label>
                <input
                  type="text"
                  className="sketch-input"
                  placeholder="My Awesome Token"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Token Symbol */}
              <div className="mb-5">
                <label className="sketch-label">symbol</label>
                <input
                  type="text"
                  className="sketch-input uppercase"
                  placeholder="MAT"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="sketch-label">description</label>
                <textarea
                  className="sketch-input resize-none"
                  placeholder="Tell the world about your token..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ borderBottom: "2px dashed #888" }}
                />
              </div>

              {/* Update Button */}
              <button
                className="sketch-button w-full"
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? "✎ updating metadata..." : "✎ Update Token"}
              </button>

              <p className="text-center sketch-alt-font text-sm text-gray-400 mt-3">
                only fields you change will be updated
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-10">
            <p className="sketch-alt-font text-sm text-gray-400">
              powered by solana • sketched with ♡
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateToken;
