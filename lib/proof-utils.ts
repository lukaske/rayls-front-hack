import { Address } from "viem";

/**
 * Reclaim SDK proof structure (what we receive from the SDK)
 */
export interface ReclaimProof {
  claimInfo?: {
    provider: string;
    parameters: string;
    context: string;
  };
  signedClaim?: {
    claim?: {
      identifier: string; // hex string that needs to be converted to bytes32
      owner: string; // address string
      timestampS: number;
      epoch: number;
    };
    signatures?: string[]; // hex strings that need to be converted to bytes[]
  };
  // Alternative structure - Reclaim SDK might return proofs in different formats
  provider?: string;
  parameters?: string;
  context?: string;
  identifier?: string;
  owner?: string;
  timestampS?: number;
  epoch?: number;
  signatures?: string[];
  claimData?: any;
  extractedParameterValues?: any;
}

/**
 * Contract proof structure (what the contract expects)
 */
export interface ContractProof {
  claimInfo: {
    provider: string;
    parameters: string;
    context: string;
  };
  signedClaim: {
    claim: {
      identifier: `0x${string}`; // bytes32
      owner: Address; // address
      timestampS: number; // uint32
      epoch: number; // uint32
    };
    signatures: `0x${string}`[]; // bytes[]
  };
}

/**
 * Transforms Reclaim SDK proof format to contract format
 * Handles multiple possible proof structures from Reclaim SDK
 */
export function transformProofToContractFormat(
  reclaimProof: ReclaimProof | ReclaimProof[] | any
): ContractProof {
  // If it's an array, take the first proof (typically there's one proof per verification)
  const proof = Array.isArray(reclaimProof) ? reclaimProof[0] : reclaimProof;

  if (!proof) {
    throw new Error("Invalid proof: proof is null or undefined");
  }

  // Log the proof structure for debugging
  console.log("Transforming proof structure:", JSON.stringify(proof, null, 2));

  // Extract claimInfo - handle different proof structures
  let claimInfo: { provider: string; parameters: string; context: string };
  
  // Check for claimData structure (actual Reclaim SDK format)
  if (proof.claimData) {
    claimInfo = {
      provider: proof.claimData.provider || "",
      parameters: proof.claimData.parameters || "",
      context: proof.claimData.context || "",
    };
  } else if (proof.claimInfo) {
    claimInfo = {
      provider: proof.claimInfo.provider || "",
      parameters: proof.claimInfo.parameters || "",
      context: proof.claimInfo.context || "",
    };
  } else {
    // Fallback: try to extract from root level
    claimInfo = {
      provider: proof.provider || "",
      parameters: proof.parameters || "",
      context: proof.context || "",
    };
  }

  // Extract signedClaim - handle different proof structures
  let signedClaim: ContractProof["signedClaim"];

  // Handle claimData structure (actual Reclaim SDK format)
  if (proof.claimData) {
    // Get identifier from root or claimData
    const identifierStr = proof.identifier || proof.claimData.identifier;
    if (!identifierStr) {
      throw new Error("Invalid proof: identifier is missing");
    }
    
    // Convert identifier from hex string to bytes32 (ensure it's 0x prefixed and 66 chars)
    const id = identifierStr.startsWith("0x") 
      ? identifierStr 
      : `0x${identifierStr}`;
    // Ensure it's exactly 66 characters (0x + 64 hex chars = 32 bytes)
    const identifier = (id.length === 66 ? id : id.padEnd(66, "0").slice(0, 66)) as `0x${string}`;

    // Get owner from claimData
    const ownerStr = proof.claimData.owner || proof.owner;
    if (!ownerStr || !ownerStr.startsWith("0x")) {
      throw new Error("Invalid proof: owner address is missing or invalid");
    }
    const owner = ownerStr.toLowerCase() as Address;

    // Extract timestamps and epoch from claimData
    const timestampS = proof.claimData.timestampS ?? proof.timestampS ?? 0;
    const epoch = proof.claimData.epoch ?? proof.epoch ?? 0;

    // Get signatures from root level
    const signatures = (proof.signatures || []).map((sig: string) => {
      if (typeof sig !== "string") {
        throw new Error("Invalid signature format");
      }
      return sig.startsWith("0x") ? (sig as `0x${string}`) : (`0x${sig}` as `0x${string}`);
    });

    if (signatures.length === 0) {
      throw new Error("Invalid proof: signatures array is empty");
    }

    signedClaim = {
      claim: {
        identifier,
        owner,
        timestampS: Number(timestampS),
        epoch: Number(epoch),
      },
      signatures,
    };
  } else if (proof.signedClaim) {
    // Handle signedClaim structure (alternative format)
    const claim = proof.signedClaim.claim;
    if (!claim) {
      throw new Error("Invalid proof: signedClaim.claim is missing");
    }

    // Convert identifier from hex string to bytes32
    let identifier: `0x${string}`;
    if (claim.identifier) {
      const id = claim.identifier.startsWith("0x") 
        ? claim.identifier 
        : `0x${claim.identifier}`;
      identifier = (id.length === 66 ? id : id.padEnd(66, "0").slice(0, 66)) as `0x${string}`;
    } else if (proof.identifier) {
      const id = proof.identifier.startsWith("0x") 
        ? proof.identifier 
        : `0x${proof.identifier}`;
      identifier = (id.length === 66 ? id : id.padEnd(66, "0").slice(0, 66)) as `0x${string}`;
    } else {
      throw new Error("Invalid proof: identifier is missing");
    }

    // Convert owner to Address
    const ownerStr = claim.owner || proof.owner || "";
    if (!ownerStr || !ownerStr.startsWith("0x")) {
      throw new Error("Invalid proof: owner address is missing or invalid");
    }
    const owner = ownerStr.toLowerCase() as Address;

    // Extract timestamps and epoch
    const timestampS = claim.timestampS ?? proof.timestampS ?? 0;
    const epoch = claim.epoch ?? proof.epoch ?? 0;

    // Convert signatures from hex strings to bytes[]
    const signatures = (proof.signedClaim.signatures || proof.signatures || []).map((sig: string) => {
      if (typeof sig !== "string") {
        throw new Error("Invalid signature format");
      }
      return sig.startsWith("0x") ? (sig as `0x${string}`) : (`0x${sig}` as `0x${string}`);
    });

    signedClaim = {
      claim: {
        identifier,
        owner,
        timestampS: Number(timestampS),
        epoch: Number(epoch),
      },
      signatures,
    };
  } else {
    // Fallback: try to construct from root level fields
    const identifierStr = proof.identifier;
    if (!identifierStr) {
      throw new Error("Invalid proof: identifier is missing");
    }

    const id = identifierStr.startsWith("0x") 
      ? identifierStr 
      : `0x${identifierStr}`;
    const identifier = (id.length === 66 ? id : id.padEnd(66, "0").slice(0, 66)) as `0x${string}`;
    
    const ownerStr = proof.owner;
    if (!ownerStr || !ownerStr.startsWith("0x")) {
      throw new Error("Invalid proof: owner address is missing or invalid");
    }
    const owner = ownerStr.toLowerCase() as Address;

    signedClaim = {
      claim: {
        identifier,
        owner,
        timestampS: Number(proof.timestampS ?? 0),
        epoch: Number(proof.epoch ?? 0),
      },
      signatures: (proof.signatures || []).map((sig: string) => 
        sig.startsWith("0x") ? (sig as `0x${string}`) : (`0x${sig}` as `0x${string}`)
      ),
    };
  }

  return {
    claimInfo,
    signedClaim,
  };
}

/**
 * Maps provider name to platform string for the contract
 */
export function mapProviderToPlatform(
  provider: "coinbase" | "binance" | "x" | "twitter" | "example"
): string {
  const mapping: Record<string, string> = {
    coinbase: "coinbase",
    binance: "binance",
    x: "x",
    twitter: "x",
    example: "example",
  };
  return mapping[provider] || provider;
}

