import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { fetchCreatedToken } from "../utils/getAccountToken";
import { useMetadataUpload } from "../hooks/useMetadataUpload";

const UpdateToken = () => {
  const { publicKey } = useWallet();
  const { uploadMetadata, isUploading } = useMetadataUpload();
  const [tokens, setTokens] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchToken() {
      if (!publicKey) throw new Error("Connect your wallet.");

      const mints = await fetchCreatedToken(publicKey);
      setTokens(mints);
    }
    fetchToken();
  }, [publicKey]);
  // console.log(publicKey);
  return (
    <div>
      <div>
        <h1>Update Token Metadata</h1>

        {/* Token selector */}
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
        >
          <option value="">Select a token</option>
          {tokens.map((token) => (
            <option key={token.id} value={token.id}>
              {token.id}
            </option>
          ))}
        </select>

        {/* Form fields */}
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        <button disabled={isUpdating || isUploading}>
          {isUpdating ? "Updating..." : "Update Metadata"}
        </button>
      </div>
    </div>
  );
};

export default UpdateToken;
