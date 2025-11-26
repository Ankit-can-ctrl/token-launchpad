import { useState } from "react";
import { uploadTokenMetadata } from "../lib/pinata";

export const useMetadataUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMetadata = async (
    name: string,
    symbol: string,
    description: string,
    imageFile: File
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setError(null);
      const uri = await uploadTokenMetadata(
        name,
        symbol,
        description,
        imageFile
      );
      return uri;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadMetadata, isUploading, error };
};
