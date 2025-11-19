import { Address } from "viem";
import KYCVerifierABI from "@/abis/KYCVerifier.json";
import KYCNFTABI from "@/abis/KYCNFT.json";

// Contract addresses from addresses.txt
export const CLAIMS_LIBRARY_ADDRESS: Address =
  "0xC375E241aDcde8181dF7D0C3306591CE8a51abA5" as Address;
export const RECLAIM_CONTRACT_ADDRESS: Address =
  "0x8714241997B67FF3896303C5aBD4399584d61131" as Address;
export const NFT_CONTRACT_ADDRESS: Address =
  "0x996dA15db8b9E938d8bEc848E27f6567990493BB" as Address;
export const KYC_VERIFIER_CONTRACT_ADDRESS: Address =
  "0xa399869468Ba49c6f7a0b65Df06adE96e5CC0D0f" as Address;
export const KYC_POOL_CONTRACT_ADDRESS: Address =
  "0x51cF4466D36C073091A6E5Cb2BfCac3dc6B7BADB" as Address;

// Legacy vault contract (if still needed)
export const VAULT_CONTRACT_ADDRESS: Address =
  "0x0000000000000000000000000000000000000000" as Address;

// ABIs from JSON files
export const KYC_VERIFIER_ABI = KYCVerifierABI;
export const NFT_ABI = KYCNFTABI;

// Legacy ABI for NFT contract (simplified version - use NFT_ABI instead)
export const NFT_ABI_LEGACY = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getKYCData",
    outputs: [
      {
        components: [
          { name: "firstName", type: "string" },
          { name: "lastName", type: "string" },
          { name: "kycStatus", type: "string" },
          { name: "platform", type: "string" },
          { name: "verifiedAddress", type: "address" },
          { name: "mintedAt", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "userAddress", type: "address" }],
    name: "hasKYCNFT",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "userAddress", type: "address" }],
    name: "getTokenIdByAddress",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ABI for Vault contract
export const VAULT_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "hasValidKYCNFT",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

