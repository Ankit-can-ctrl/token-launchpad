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
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useMetadataUpload } from "../hooks/useMetadataUpload";
import { createMetadataInstruction } from "../utils/metaplex";

const TokenMint = ({
  setManageToken,
}: {
  setManageToken: (show: boolean) => void;
}) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { uploadMetadata, isUploading } = useMetadataUpload();
  const [initialSupply, setInitialSupply] = useState<number>(1000000);
  const [decimals, setDecimals] = useState<number>(9);
  const [mintAddress, setMintAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [ataKey, setAtaKey] = useState<PublicKey>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // metadata state
  const [tokenName, setTokenName] = useState<string>("");
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [tokenDescription, setTokenDescription] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const createToken = async () => {
    if (!publicKey || !signTransaction)
      return toast.error("Connect your wallet.");
    if (!tokenName || !tokenSymbol)
      return toast.error("Name and symbol are required.");
    if (!imageFile) return toast.error("Please upload an image.");
    try {
      setLoading(true);

      toast.info("Uploading metadata to IPFS....");
      const metadataUri = await uploadMetadata(
        tokenName,
        tokenSymbol,
        tokenDescription,
        imageFile
      );

      if (!metadataUri) return toast.error("Metadata upload failed.");
      toast.success("Metadata uploaded! Creating token...");

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
        createMintToInstruction(mintKeypair.publicKey, ata, publicKey, amount),

        // 5. create metadata
        createMetadataInstruction(
          mintKeypair.publicKey,
          publicKey,
          tokenName,
          tokenSymbol,
          metadataUri
        )
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

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      {/* Google Font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Architects+Daughter&display=swap');
          
          .sketch-font {
            font-family: 'Caveat', cursive;
          }
          
          .sketch-alt-font {
            font-family: 'Architects Daughter', cursive;
          }
          
          @keyframes wiggle {
            0%, 100% { transform: rotate(-0.5deg); }
            50% { transform: rotate(0.5deg); }
          }
          
          @keyframes draw {
            to { stroke-dashoffset: 0; }
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
          
          .doodle-corner {
            position: absolute;
            width: 40px;
            height: 40px;
            opacity: 0.3;
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
          
          .result-card {
            background: #fffef9;
            border: 2px solid #2d2d2d;
            border-radius: 5px 10px 8px 12px;
            position: relative;
            overflow: hidden;
          }
          
          .result-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 25px;
            background: repeating-linear-gradient(
              90deg,
              transparent,
              transparent 8px,
              #2d2d2d 8px,
              #2d2d2d 10px
            );
            opacity: 0.1;
          }
          
          .floating {
            animation: float 4s ease-in-out infinite;
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
          
          .sketch-wallet-btn {
            font-family: 'Caveat', cursive;
            font-size: 1.1rem;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border: 2px solid #2d2d2d;
            border-radius: 4px 10px 6px 12px;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 2px 2px 0 #888;
          }
          
          .sketch-wallet-btn:hover:not(:disabled) {
            transform: translate(-1px, -1px);
            box-shadow: 3px 3px 0 #888;
          }
          
          .sketch-wallet-btn:active:not(:disabled) {
            transform: translate(1px, 1px);
            box-shadow: 1px 1px 0 #888;
          }
          
          .sketch-wallet-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .sketch-wallet-btn-connect {
            background: #2d2d2d;
            color: #fffef9;
          }
          
          .sketch-wallet-btn-connect:hover:not(:disabled) {
            background: #444;
          }
          
          .sketch-wallet-btn-disconnect {
            background: #fffef9;
            color: #2d2d2d;
          }
          
          .sketch-wallet-btn-disconnect:hover:not(:disabled) {
            background: #fee2e2;
            border-color: #b91c1c;
            color: #b91c1c;
          }
          
          /* Override Solana Wallet Adapter button styles */
          .sketch-wallet-wrapper .wallet-adapter-button {
            font-family: 'Caveat', cursive !important;
            font-size: 1.2rem !important;
            font-weight: 500 !important;
            background: #2d2d2d !important;
            color: #fffef9 !important;
            border: 2px solid #2d2d2d !important;
            border-radius: 4px 10px 6px 12px !important;
            padding: 8px 16px !important;
            height: auto !important;
            line-height: 1.4 !important;
            box-shadow: 2px 2px 0 #888 !important;
            transition: all 0.15s ease !important;
          }
          
          .sketch-wallet-wrapper .wallet-adapter-button:hover {
            transform: translate(-1px, -1px) !important;
            box-shadow: 3px 3px 0 #888 !important;
            background: #444 !important;
          }
          
          .sketch-wallet-wrapper .wallet-adapter-button:active {
            transform: translate(1px, 1px) !important;
            box-shadow: 1px 1px 0 #888 !important;
          }
          
          .sketch-wallet-wrapper .wallet-adapter-button-trigger {
            background: #2d2d2d !important;
          }
          
          .sketch-wallet-wrapper .wallet-adapter-button[disabled] {
            opacity: 0.6 !important;
            cursor: not-allowed !important;
          }
          
          /* Disconnect button - different style */
          .sketch-wallet-wrapper .wallet-adapter-button-trigger[data-state="open"],
          .sketch-wallet-wrapper .wallet-adapter-dropdown button {
            background: #fffef9 !important;
            color: #2d2d2d !important;
          }
          
          .sketch-wallet-wrapper .wallet-adapter-button:not(.wallet-adapter-button-trigger):hover {
            background: #fee2e2 !important;
            border-color: #b91c1c !important;
            color: #b91c1c !important;
          }
          
          /* Wallet icon in button */
          .sketch-wallet-wrapper .wallet-adapter-button-start-icon {
            margin-right: 8px !important;
          }
          
          .sketch-wallet-wrapper .wallet-adapter-button-start-icon img {
            width: 20px !important;
            height: 20px !important;
          }

          .manage-token-wrapper {
            position: absolute;
            top: 24px;
            right: 40px;
            z-index: 5;
          }

          .manage-token-button {
            font-family: 'Caveat', cursive;
            font-size: 1.2rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: #fffef9;
            color: #2d2d2d;
            border: 2.5px solid #2d2d2d;
            border-radius: 6px 14px 10px 16px;
            padding: 10px 20px;
            box-shadow: 4px 4px 0 #2d2d2d;
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }

          .manage-token-button:hover {
            transform: translate(-2px, -2px);
            box-shadow: 6px 6px 0 #2d2d2d;
          }

          .manage-token-button:active {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0 #2d2d2d;
          }
        `}
      </style>

      <div className="min-h-screen paper-bg py-8 px-4 relative overflow-hidden">
        {/* Hand-drawn doodles in corners */}
        <svg
          className="doodle-corner top-4 left-4"
          viewBox="0 0 40 40"
          fill="none"
          stroke="#2d2d2d"
          strokeWidth="2"
        >
          <path d="M5 35 Q 20 5, 35 35" strokeLinecap="round" />
          <circle cx="10" cy="10" r="3" />
          <circle cx="30" cy="15" r="2" />
        </svg>
        <div className="manage-token-wrapper">
          <button
            onClick={() => setManageToken(true)}
            className="manage-token-button"
          >
            <span>Manage your tokens</span>
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        {/* Floating shapes */}
        <div className="absolute top-20 right-20 w-16 h-16 border-2 border-dashed border-gray-300 rounded-full floating opacity-30" />
        <div
          className="absolute bottom-40 left-16 w-12 h-12 border-2 border-gray-300 floating opacity-30"
          style={{
            animationDelay: "1s",
            borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
          }}
        />
        <div className="w-full mx-auto relative px-8 lg:px-16">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="sketch-alt-font text-sm text-gray-500 tracking-wider">
                ~ solana devnet ~
              </span>
            </div>
            <h1 className="sketch-font text-6xl font-bold text-gray-800 mb-2">
              <span className="sketch-title">Token Launchpad</span>
            </h1>
            <p className="sketch-alt-font text-gray-500 text-lg">
              sketch your token into existence ✨
            </p>
          </div>

          {/* Wallet Status */}
          <div
            className="sketch-box p-4 mb-6 max-w-md mx-auto"
            style={{ transform: "rotate(0.5deg)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                  </svg>
                </div>
                <div>
                  <span className="sketch-label text-sm">wallet</span>
                  <p className="sketch-alt-font text-gray-800">
                    {publicKey
                      ? truncateAddress(publicKey.toString())
                      : "not connected"}
                  </p>
                </div>
              </div>
              <div className="sketch-wallet-wrapper">
                {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
              </div>
            </div>
          </div>

          {/* Main Form - 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Card 1: Token Image */}
            <div
              className="sketch-box p-6"
              style={{ transform: "rotate(-0.3deg)" }}
            >
              <div className="text-center mb-4">
                <h2 className="sketch-font text-xl font-bold text-gray-800">
                  Token Image
                </h2>
                <p className="sketch-alt-font text-gray-500 text-sm">
                  upload your logo 🖼️
                </p>
              </div>
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
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-400"
                      style={{ borderRadius: "10px 20px 15px 25px" }}
                    />
                    <span className="sketch-alt-font text-gray-600 text-sm">
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
                      click to upload
                    </p>
                    <p className="sketch-alt-font text-sm text-gray-400 mt-1">
                      PNG, JPG, GIF, WEBP
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Token Details */}
            <div
              className="sketch-box p-6"
              style={{ transform: "rotate(0.3deg)" }}
            >
              <div className="text-center mb-4">
                <h2 className="sketch-font text-xl font-bold text-gray-800">
                  Token Details
                </h2>
                <p className="sketch-alt-font text-gray-500 text-sm">
                  name & description ✏️
                </p>
              </div>

              {/* Token Name */}
              <div className="mb-4">
                <label className="sketch-label">token name</label>
                <input
                  type="text"
                  className="sketch-input"
                  placeholder="My Awesome Token"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                />
              </div>

              {/* Token Symbol */}
              <div className="mb-4">
                <label className="sketch-label">symbol</label>
                <input
                  type="text"
                  className="sketch-input uppercase"
                  placeholder="MAT"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>

              {/* Description */}
              <div>
                <label className="sketch-label">description</label>
                <textarea
                  className="sketch-input resize-none"
                  placeholder="Tell the world about your token..."
                  value={tokenDescription}
                  onChange={(e) => setTokenDescription(e.target.value)}
                  rows={3}
                  style={{ borderBottom: "2px dashed #888" }}
                />
              </div>
            </div>

            {/* Card 3: Supply & Create */}
            <div
              className="sketch-box p-6"
              style={{ transform: "rotate(-0.5deg)" }}
            >
              <div className="text-center mb-4">
                <h2 className="sketch-font text-xl font-bold text-gray-800">
                  Token Supply
                </h2>
                <p className="sketch-alt-font text-gray-500 text-sm">
                  configure & launch 🚀
                </p>
              </div>

              {/* Initial Supply */}
              <div className="mb-4">
                <label className="sketch-label">initial supply</label>
                <input
                  type="number"
                  className="sketch-input"
                  placeholder="1,000,000"
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(Number(e.target.value))}
                  min={0}
                />
              </div>

              {/* Decimals */}
              <div className="mb-6">
                <label className="sketch-label">decimals</label>
                <div className="relative">
                  <input
                    type="number"
                    className="sketch-input"
                    placeholder="9"
                    value={decimals}
                    onChange={(e) => setDecimals(Number(e.target.value))}
                    min={0}
                    max={9}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 sketch-alt-font text-xs text-gray-400">
                    (0-9)
                  </span>
                </div>
              </div>

              {/* Create Button */}
              <button
                className="sketch-button w-full"
                onClick={createToken}
                disabled={loading || isUploading}
              >
                {isUploading
                  ? "✎ uploading..."
                  : loading
                  ? "✎ creating..."
                  : "✎ Create Token"}
              </button>

              <p className="text-center sketch-alt-font text-sm text-gray-400 mt-3">
                ~0.015 SOL
              </p>
            </div>
          </div>

          {/* Results */}
          {(mintAddress || ataKey) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mintAddress && (
                <div
                  className="result-card p-4"
                  style={{ transform: "rotate(-0.5deg)" }}
                >
                  <div className="pt-4">
                    <span className="sketch-label text-sm">✓ mint address</span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <code className="sketch-alt-font text-sm text-gray-700 break-all">
                        {mintAddress}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(mintAddress);
                          toast.success("Copied!");
                        }}
                        className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {ataKey && (
                <div
                  className="result-card p-4"
                  style={{ transform: "rotate(0.3deg)" }}
                >
                  <div className="pt-4">
                    <span className="sketch-label text-sm">
                      ✓ token account (ATA)
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <code className="sketch-alt-font text-sm text-gray-700 break-all">
                        {ataKey.toString()}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ataKey.toString());
                          toast.success("Copied!");
                        }}
                        className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

export default TokenMint;
