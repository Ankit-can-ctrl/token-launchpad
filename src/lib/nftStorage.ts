import { NFTStorage, Blob } from "nft.storage";

interface metadataType {
  name: string;
  symbol: string;
  description: string;
  image: string;
}
// Get your free API key from https://nft.storage
const NFT_STORAGE_API_KEY = import.meta.env.VITE_NFT_STORAGE_API_KEY || "";

const client = new NFTStorage({ token: NFT_STORAGE_API_KEY });

// upload an image file to NFT.storage (IPFS)

export const uploadImage = async (imageFile: File): Promise<string> => {
  const cid = await client.storeBlob(imageFile);
  return `ipfs://${cid}`;
};

// upload token metadata JSON to NFT.storage (IPFS)

export const uploadMetadataJSON = async (
  metadata: metadataType
): Promise<string> => {
  const metadataBlob = new Blob([JSON.stringify(metadata)], {
    type: "application/json",
  });
  const cid = await client.storeBlob(metadataBlob);
  return `ipfs://${cid}`;
};

// upload image and metadata together

export const uploadTokenMetadata = async (
  name: string,
  symbol: string,
  description: string,
  imageFile: File
): Promise<string> => {
  const imageUri = await uploadImage(imageFile);
  const metadataUri = await uploadMetadataJSON({
    name,
    symbol,
    description,
    image: imageUri,
  });

  return metadataUri;
};
