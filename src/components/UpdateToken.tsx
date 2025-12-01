import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { PublicKey, Transaction } from "@solana/web3.js";
import { fetchMetadata, fetchOffchainMetadata } from "../utils/getMetadata";
import { uploadImage, uploadMetadataJSON } from "../lib/pinata";
import { updateMetadataInstruction } from "../utils/metaplex";

interface UpdateTokenProps {
  selectedToken: string;
}

const UpdateToken = ({ selectedToken }: UpdateTokenProps) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);

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

  const getImageUrl = (uri: string) => {
    if (uri.startsWith("ipfs://")) {
      return uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    return uri;
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="sketch-box p-8 text-center">
          <span className="loading-spinner" />
          <p className="sketch-alt-font text-gray-500 mt-4">
            Loading token metadata...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="sketch-box p-6"
        style={{ transform: "rotate(-0.5deg)" }}
      >
      {/* Card Header */}
      <div className="text-center mb-6">
        <h2 className="sketch-font text-2xl font-bold text-gray-800">
          Update Metadata
        </h2>
        <p className="sketch-alt-font text-gray-500 text-sm">
          modify your token's appearance ✏️
        </p>
      </div>

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
          new image <span className="text-gray-400 text-sm">(optional)</span>
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
    </div>
  );
};

export default UpdateToken;
