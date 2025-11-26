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
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useState } from "react";
import { toast } from "sonner";
import { useMetadataUpload } from "../hooks/useMetadataUpload";
import { createMetadataInstruction } from "../utils/metaplex";

const TokenMint = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { uploadMetadata, isUploading } = useMetadataUpload();
  const [initialSupply, setInitialSupply] = useState<number>(100);
  const [decimals, setDecimals] = useState<number>(8);
  const [mintAddress, setMintAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [ataKey, setAtaKey] = useState<PublicKey>();

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

      // 1. upload metadata to IPFS
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

  return (
    <div>
      <p>
        Your Public Key :{" "}
        {publicKey ? publicKey?.toString() : "Connect your wallet first."}
      </p>
      <div className="token_inputs">
        <div>
          <label>Initial supply :</label>
          <input
            onChange={(e) => {
              setInitialSupply(Number(e.target.value));
            }}
            type="number"
            min={0}
            placeholder="Initial supply"
          />
        </div>
        <div>
          <label>Set decimals value :</label>
          <input
            onChange={(e) => setDecimals(Number(e.target.value))}
            type="number"
            min={0}
            max={9}
            placeholder="Initial supply"
          />
        </div>
      </div>
      <p>
        ATA address :{" "}
        {loading
          ? "Loading..."
          : ataKey
          ? ataKey?.toString()
          : "create token to get your ata address"}
      </p>
      <p>
        mint address :{" "}
        {loading
          ? "Loading..."
          : mintAddress
          ? mintAddress?.toString()
          : "create token to get your ata address"}
      </p>
      <input
        type="text"
        placeholder="Token name"
        value={tokenName}
        onChange={(e) => setTokenName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Token symbol"
        value={tokenSymbol}
        onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
      />
      <textarea
        placeholder="Describe your token..."
        value={tokenDescription}
        onChange={(e) => setTokenDescription(e.target.value)}
      />
      <div>
        <label>Token Image</label>
        <input
          type="file"
          accept="image/png, image/jpeg, image/gif, image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setImageFile(file);
          }}
        />
        {/* show preview */}
        {imageFile && (
          <img
            src={URL.createObjectURL(imageFile)}
            alt="Preview"
            style={{ width: 100, height: 100, objectFit: "cover" }}
          />
        )}
      </div>
      <button onClick={createToken} disabled={loading || isUploading}>
        {isUploading
          ? "Uploading metadata..."
          : loading
          ? "Creating token..."
          : "Create token"}
      </button>
    </div>

    // <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
    //   {/* Animated background gradient orbs */}
    //   <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse" />
    //   <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
    //   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[150px]" />

    //   {/* Grid pattern overlay */}
    //   <div
    //     className="absolute inset-0 opacity-[0.03]"
    //     style={{
    //       backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
    //                            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
    //       backgroundSize: "60px 60px",
    //     }}
    //   />

    //   <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
    //     {/* Header */}
    //     <div className="text-center mb-12">
    //       <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 mb-6">
    //         <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
    //         <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">
    //           Solana Devnet
    //         </span>
    //       </div>
    //       <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
    //         Token Forge
    //       </h1>
    //       <p className="text-gray-500 text-lg">
    //         Create your own SPL token in seconds
    //       </p>
    //     </div>

    //     {/* Main Card */}
    //     <div className="relative group">
    //       {/* Card glow effect */}
    //       <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />

    //       <div className="relative bg-[#12121a] border border-white/5 rounded-2xl p-8">
    //         {/* Wallet Status */}
    //         <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-8">
    //           <div className="flex items-center gap-3">
    //             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
    //               <svg
    //                 className="w-5 h-5 text-white"
    //                 fill="none"
    //                 stroke="currentColor"
    //                 viewBox="0 0 24 24"
    //               >
    //                 <path
    //                   strokeLinecap="round"
    //                   strokeLinejoin="round"
    //                   strokeWidth={2}
    //                   d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
    //                 />
    //               </svg>
    //             </div>
    //             <div>
    //               <p className="text-xs text-gray-500 uppercase tracking-wider">
    //                 Wallet
    //               </p>
    //               <p className="text-sm font-mono text-gray-300">7xKp...4nFq</p>
    //             </div>
    //           </div>
    //           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
    //             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
    //             <span className="text-xs font-medium text-emerald-400">
    //               Connected
    //             </span>
    //           </div>
    //         </div>

    //         {/* Form Fields */}
    //         <div className="space-y-6 mb-8">
    //           {/* Token Name (decorative) */}
    //           <div>
    //             <label className="block text-sm font-medium text-gray-400 mb-2">
    //               Token Name
    //             </label>
    //             <input
    //               type="text"
    //               placeholder="My Awesome Token"
    //               className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
    //             />
    //           </div>

    //           {/* Token Symbol (decorative) */}
    //           <div>
    //             <label className="block text-sm font-medium text-gray-400 mb-2">
    //               Token Symbol
    //             </label>
    //             <input
    //               type="text"
    //               placeholder="MAT"
    //               className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all uppercase"
    //             />
    //           </div>

    //           {/* Two column layout */}
    //           <div className="grid grid-cols-2 gap-4">
    //             <div>
    //               <label className="block text-sm font-medium text-gray-400 mb-2">
    //                 Initial Supply
    //               </label>
    //               <div className="relative">
    //                 <input
    //                   type="number"
    //                   placeholder="1,000,000"
    //                   className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
    //                 />
    //               </div>
    //             </div>
    //             <div>
    //               <label className="block text-sm font-medium text-gray-400 mb-2">
    //                 Decimals
    //               </label>
    //               <div className="relative">
    //                 <input
    //                   type="number"
    //                   placeholder="9"
    //                   className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
    //                 />
    //                 <div className="absolute right-3 top-1/2 -translate-y-1/2">
    //                   <span className="text-xs text-gray-600">0-9</span>
    //                 </div>
    //               </div>
    //             </div>
    //           </div>
    //         </div>

    //         {/* Create Button */}
    //         <button className="w-full relative group/btn overflow-hidden rounded-xl p-px">
    //           <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 opacity-80 group-hover/btn:opacity-100 transition-opacity" />
    //           <div className="relative bg-[#12121a] rounded-[11px] px-8 py-4 group-hover/btn:bg-transparent transition-colors duration-300">
    //             <span className="flex items-center justify-center gap-2 font-semibold text-white">
    //               <svg
    //                 className="w-5 h-5"
    //                 fill="none"
    //                 stroke="currentColor"
    //                 viewBox="0 0 24 24"
    //               >
    //                 <path
    //                   strokeLinecap="round"
    //                   strokeLinejoin="round"
    //                   strokeWidth={2}
    //                   d="M13 10V3L4 14h7v7l9-11h-7z"
    //                 />
    //               </svg>
    //               Create Token
    //             </span>
    //           </div>
    //         </button>

    //         {/* Estimated Cost */}
    //         <div className="mt-4 text-center">
    //           <span className="text-xs text-gray-600">
    //             Estimated cost: ~0.00204 SOL
    //           </span>
    //         </div>
    //       </div>
    //     </div>

    //     {/* Result Cards (shown after creation) */}
    //     <div className="mt-8 space-y-4">
    //       {/* Mint Address Card */}
    //       <div className="relative overflow-hidden rounded-xl bg-[#12121a] border border-white/5 p-5">
    //         <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
    //         <div className="relative flex items-center justify-between">
    //           <div>
    //             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
    //               Mint Address
    //             </p>
    //             <p className="font-mono text-sm text-gray-300">
    //               Create a token to see address
    //             </p>
    //           </div>
    //           <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
    //             <svg
    //               className="w-4 h-4 text-gray-400"
    //               fill="none"
    //               stroke="currentColor"
    //               viewBox="0 0 24 24"
    //             >
    //               <path
    //                 strokeLinecap="round"
    //                 strokeLinejoin="round"
    //                 strokeWidth={2}
    //                 d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    //               />
    //             </svg>
    //           </button>
    //         </div>
    //       </div>

    //       {/* ATA Address Card */}
    //       <div className="relative overflow-hidden rounded-xl bg-[#12121a] border border-white/5 p-5">
    //         <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
    //         <div className="relative flex items-center justify-between">
    //           <div>
    //             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
    //               Token Account (ATA)
    //             </p>
    //             <p className="font-mono text-sm text-gray-300">
    //               Create a token to see address
    //             </p>
    //           </div>
    //           <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
    //             <svg
    //               className="w-4 h-4 text-gray-400"
    //               fill="none"
    //               stroke="currentColor"
    //               viewBox="0 0 24 24"
    //             >
    //               <path
    //                 strokeLinecap="round"
    //                 strokeLinejoin="round"
    //                 strokeWidth={2}
    //                 d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    //               />
    //             </svg>
    //           </button>
    //         </div>
    //       </div>
    //     </div>

    //     {/* Footer */}
    //     <div className="mt-12 text-center">
    //       <p className="text-xs text-gray-600">
    //         Powered by Solana • Built with SPL Token Program
    //       </p>
    //     </div>
    //   </div>
    // </div>
  );
};

export default TokenMint;
