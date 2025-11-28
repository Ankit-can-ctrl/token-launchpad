import {
  createCreateMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";

//   Derive metadata PDA for a given mint
export const getMetadataPDA = (mint: PublicKey): PublicKey => {
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return metadataPDA;
};

// to update the metadata of the token
export const updateMetadataInstruction = (
  mint: PublicKey,
  updateAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string
): TransactionInstruction => {
  const metadataPDA = getMetadataPDA(mint);

  return createUpdateMetadataAccountV2Instruction(
    {
      metadata: metadataPDA,
      updateAuthority: updateAuthority,
    },
    {
      updateMetadataAccountArgsV2: {
        data: {
          name: name,
          symbol: symbol,
          uri: uri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        updateAuthority: updateAuthority,
        primarySaleHappened: null,
        isMutable: true,
      },
    }
  );
};

// create metadata account instruction
export const createMetadataInstruction = (
  mint: PublicKey,
  payer: PublicKey,
  name: string,
  symbol: string,
  uri: string
): TransactionInstruction => {
  const metadataPDA = getMetadataPDA(mint);

  return createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: mint,
      mintAuthority: payer,
      payer: payer,
      updateAuthority: payer,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: name,
          symbol: symbol,
          uri: uri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      },
    }
  );
};
