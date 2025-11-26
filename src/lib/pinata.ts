const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";

interface metadataType {
  name: string;
  symbol: string;
  description: string;
  image: string;
}

export const uploadImage = async (imageFile: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", imageFile);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Image upload failed");

  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
};

// upload token metadata JSON to NFT.storage (IPFS)

export const uploadMetadataJSON = async (
  metadata: metadataType
): Promise<string> => {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) throw new Error("Metadata upload failed");

  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
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
