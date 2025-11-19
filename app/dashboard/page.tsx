"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { Address } from "viem";
import { raylsDevnet } from "@/lib/chains";
import { NFTCard } from "@/components/nft-card";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationOverlay } from "@/components/verification-overlay";
import { 
  NFT_CONTRACT_ADDRESS, 
  NFT_ABI, 
  KYC_VERIFIER_CONTRACT_ADDRESS,
  KYC_VERIFIER_ABI 
} from "@/lib/contracts";
import { transformProofToContractFormat, mapProviderToPlatform } from "@/lib/proof-utils";
import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useReclaim } from "@/hooks/useReclaim";


interface VerificationCollection {
  id: string;
  name: string;
  issuer: string;
  verificationMethod: "coinbase" | "binance" | "x" | "twitter" | "example";
  description: string;
}

const VERIFICATION_COLLECTIONS: VerificationCollection[] = [
  {
    id: "coinbase-kyc",
    name: "Coinbase KYC Verified",
    issuer: "Coinbase",
    verificationMethod: "coinbase",
    description: "Verify your identity using Coinbase KYC credentials",
  },
  {
    id: "binance-kyc",
    name: "Binance KYC Verified",
    issuer: "Binance",
    verificationMethod: "binance",
    description: "Verify your identity using Binance KYC credentials",
  },
  {
    id: "x-username",
    name: "X Username Verified",
    issuer: "X (Twitter)",
    verificationMethod: "x",
    description: "Verify your X (Twitter) username",
  },
  {
    id: "example-verification",
    name: "Example Verification",
    issuer: "Example",
    verificationMethod: "example",
    description: "Example verification provider for testing purposes",
  },
];

export default function DashboardPage() {
  const { primaryWallet, user } = useDynamicContext();
  const walletConnected = (primaryWallet !== null || user)
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();
  const [userNFTs, setUserNFTs] = useState<Map<string, string>>(new Map());
  const [verifying, setVerifying] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const { 
    proofs, 
    isLoading: reclaimLoading, 
    isWaitingForMobile,
    isVerified,
    error: reclaimError, 
    startVerification,
    cancelVerification
  } = useReclaim();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const totalCollections = VERIFICATION_COLLECTIONS.length;
  const verifiedCount = userNFTs.size;
  const remainingCount = Math.max(totalCollections - verifiedCount, 0);
  const nextCollection = VERIFICATION_COLLECTIONS.find(
    (collection) => !userNFTs.has(collection.id)
  );
  const formattedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";
  const verificationStatusLabel = verifying
    ? "Mobile verification in progress"
    : isVerified
    ? "Tier 1 credentials issued"
    : "Awaiting verification";
  const verificationStatusTone = verifying
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : isVerified
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-700 border-slate-200";
  const statusSubtext = verifying
    ? "Complete the flow on your mobile device"
    : isVerified
    ? "You're cleared for Rayls Tier 1 experiences"
    : "Select a provider below to begin";
  const lastActionLabel = verifying
    ? "Awaiting proofs"
    : isVerified
    ? "Credentials minted"
    : "Ready to verify";

  // Check NFT ownership for each collection
  const { data: nftBalance, refetch: refetchNFTBalance } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!walletConnected },
  });

  // Check if user has KYC NFT
  const { data: hasKYCNFT } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: "hasKYCNFT",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!walletConnected },
  });

  // Get token ID by address if user has NFT
  const { data: tokenId } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: "getTokenIdByAddress",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!walletConnected && hasKYCNFT === true },
  });

  // Get KYC data for the token to determine platform
  interface KYCData {
    firstName: string;
    lastName: string;
    kycStatus: string;
    platform: string;
    verifiedAddress: Address;
    mintedAt: bigint;
  }

  const { data: kycDataRaw } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: "getKYCData",
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!address && !!walletConnected && !!tokenId && tokenId !== null && Number(tokenId) > 0 },
  });
  
  const kycData = kycDataRaw as KYCData | undefined;

  // Fetch user's NFTs when balance changes
  useEffect(() => {
    if (address && hasKYCNFT && tokenId !== null && tokenId !== undefined && Number(tokenId) > 0) {
      // Determine which collection this belongs to based on platform from KYC data
      setUserNFTs((prev) => {
        const newMap = new Map(prev);
        
        // If we have KYC data, use the platform to determine the collection
        if (kycData && typeof kycData === 'object' && 'platform' in kycData && kycData.platform) {
          const platform = String(kycData.platform).toLowerCase();
          let collectionId = "";
          
          if (platform.includes("coinbase")) {
            collectionId = "coinbase-kyc";
          } else if (platform.includes("binance")) {
            collectionId = "binance-kyc";
          } else if (platform.includes("x") || platform.includes("twitter")) {
            collectionId = "x-username";
          } else {
            collectionId = "example-verification";
          }
          
          if (collectionId && !newMap.has(collectionId)) {
            newMap.set(collectionId, tokenId.toString());
          }
        } else {
          // Fallback: if no KYC data yet, we'll update when it's available
          // For now, don't add it to the map
        }
        
        return newMap;
      });
    }
  }, [address, hasKYCNFT, tokenId, kycData]);

  // Handle proofs when they're received - submit to contract
  useEffect(() => {
    if (proofs && address && verifying && !submittingProof) {
      const submitProofToContract = async () => {
        try {
          setSubmittingProof(true);
          setProofError(null);

          // Check if we're on the correct chain (Rayls Devnet)
          if (chainId !== raylsDevnet.id) {
            console.log(`Switching chain from ${chainId} to ${raylsDevnet.id}`);
            try {
              await switchChain({ chainId: raylsDevnet.id });
              // Wait a bit for the chain switch to complete
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (switchError: any) {
              throw new Error(`Please switch to Rayls Devnet network. ${switchError.message || ''}`);
            }
          }

          // Find the collection being verified
          const collection = VERIFICATION_COLLECTIONS.find(c => c.id === verifying);
          if (!collection) {
            throw new Error("Collection not found");
          }

          // Transform proof to contract format
          const contractProof = transformProofToContractFormat(proofs);
          const platform = mapProviderToPlatform(collection.verificationMethod);

          console.log("Submitting proof to contract:", {
            proof: contractProof,
            platform,
            to: address,
            chainId: raylsDevnet.id,
          });

          // Call verifyAndMint on the KYCVerifier contract
          // Explicitly set the chain to ensure we're on Rayls Devnet
          writeContract({
            address: KYC_VERIFIER_CONTRACT_ADDRESS,
            abi: KYC_VERIFIER_ABI,
            functionName: "verifyAndMint",
            args: [contractProof, platform, address],
            chainId: raylsDevnet.id,
          });
        } catch (error: any) {
          console.error("Error submitting proof to contract:", error);
          setProofError(error.message || "Failed to submit proof to contract");
          setSubmittingProof(false);
          setVerifying(null);
        }
      };

      submitProofToContract();
    }
  }, [proofs, address, verifying, submittingProof, writeContract, chainId, switchChain]);

  // Handle transaction success
  useEffect(() => {
    if (isTransactionSuccess && hash && verifying) {
      // Transaction successful - refetch NFT balance and token ID
      refetchNFTBalance();
      
      // Find the collection being verified
      const collection = VERIFICATION_COLLECTIONS.find(c => c.id === verifying);
      if (collection) {
        // The NFT should now be minted - we'll update the UI after refetch
        // For now, we'll mark it as verified (tokenId will be updated by the refetch)
        setUserNFTs((prev) => {
          const newMap = new Map(prev);
          // Use a temporary ID - will be updated when tokenId is fetched
          newMap.set(collection.id, "pending");
          return newMap;
        });
      }

      setSubmittingProof(false);
      setVerifying(null);
    }
  }, [isTransactionSuccess, hash, verifying, refetchNFTBalance]);

  // Handle errors
  useEffect(() => {
    if (reclaimError) {
      console.error("Verification error:", reclaimError);
      setVerifying(null);
      setSubmittingProof(false);
    }
  }, [reclaimError]);

  // Handle proof submission errors
  useEffect(() => {
    if (proofError) {
      console.error("Proof submission error:", proofError);
    }
  }, [proofError]);

  const handleVerify = async (collection: VerificationCollection) => {
    if (!address) return;

    setVerifying(collection.id);
    setProofError(null);
    setSubmittingProof(false);
    await startVerification(collection.verificationMethod);
  };

  const handleCancelVerification = () => {
    cancelVerification();
    setVerifying(null);
    setSubmittingProof(false);
    setProofError(null);
  };

  const handleStartNextVerification = () => {
    if (nextCollection) {
      handleVerify(nextCollection);
    }
  };

  if (!walletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Please Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your wallet to view and verify KYC NFTs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      {(isWaitingForMobile || isVerified) && (
        <VerificationOverlay 
          onCancel={handleCancelVerification} 
          isVerified={isVerified}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl shadow-blue-500/30">
              <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 left-6 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10 space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                  Tier 1 KYC Dashboard
                </p>
                <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                  Own your Tier 1 compliance identity
                </h1>
                <p className="text-lg text-white/80 max-w-3xl">
                  Mint elite, zero-knowledge credentials powered by Reclaim Protocol to unlock institution-grade products across Rayls Network.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleStartNextVerification}
                    disabled={!nextCollection || !address || reclaimLoading || verifying !== null}
                    className="bg-white text-blue-700 hover:bg-white/90 px-6 py-6 text-base font-semibold"
                  >
                    {nextCollection ? "Start next verification" : "All credentials verified"}
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="text-white border border-white/30 bg-white/10 hover:bg-white/20 px-6 py-6 text-base font-semibold"
                  >
                    <a href="#verified-credentials">View verified NFTs</a>
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                    <p className="text-xs uppercase text-white/70">Verified</p>
                    <p className="text-3xl font-semibold">{verifiedCount}</p>
                    <p className="text-sm text-white/70">
                      of {totalCollections} collections
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                    <p className="text-xs uppercase text-white/70">Remaining</p>
                    <p className="text-3xl font-semibold">{remainingCount}</p>
                    <p className="text-sm text-white/70">credentials left</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                    <p className="text-xs uppercase text-white/70">Status</p>
                    <p className="text-lg font-semibold">{verificationStatusLabel}</p>
                    <p className="text-sm text-white/70">{statusSubtext}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                    <p className="text-xs uppercase text-white/70">Wallet</p>
                    <p className="text-lg font-semibold">{formattedAddress}</p>
                    <p className="text-sm text-white/70">
                      Connected via Dynamic
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <Card className="border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/60">
                <CardHeader>
                  <CardTitle>Wallet overview</CardTitle>
                  <CardDescription>Tier 1 credential snapshot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Connected wallet
                    </p>
                    <p className="text-xl font-semibold text-gray-900 mt-2">
                      {formattedAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                      Verification status
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${verificationStatusTone}`}
                    >
                      {verificationStatusLabel}
                    </span>
                    <p className="text-sm text-gray-500 mt-3">
                      {statusSubtext}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 border-t border-dashed pt-4">
                    <span>Last action</span>
                    <span className="font-medium text-gray-900">{lastActionLabel}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-blue-200/80 bg-blue-50/80 shadow-lg shadow-blue-200/50">
                <CardHeader>
                  <CardTitle>Tier 1 checklist</CardTitle>
                  <CardDescription>Stay on track to unlock access</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-sm text-blue-900">
                    <li className="flex gap-3 items-start">
                      <span className="h-8 w-8 rounded-full bg-white/80 text-blue-700 font-semibold flex items-center justify-center">
                        1
                      </span>
                      Connect your preferred wallet above.
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="h-8 w-8 rounded-full bg-white/80 text-blue-700 font-semibold flex items-center justify-center">
                        2
                      </span>
                      Choose a Tier 1 provider and complete the Reclaim verification flow.
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="h-8 w-8 rounded-full bg-white/80 text-blue-700 font-semibold flex items-center justify-center">
                        3
                      </span>
                      Return to the Demo vault with your fresh NFT credentials to unlock deposits.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <section className="space-y-6" id="tier1-collections">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
                  Available credentials
                </p>
                <h2 className="text-2xl font-semibold text-gray-900 mt-2">
                  Tier 1 KYC Collections
                </h2>
                <p className="text-gray-600 max-w-2xl">
                  Select one of the providers below to mint a reusable verification NFT. Each credential unlocks institution-grade utility across the Rayls ecosystem.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm text-blue-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {nextCollection
                  ? `${remainingCount} credentials left to unlock`
                  : "All Tier 1 credentials unlocked"}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {VERIFICATION_COLLECTIONS.filter((collection) => !userNFTs.has(collection.id)).map((collection) => {
                const isVerifying = verifying === collection.id && reclaimLoading;

                return (
                  <NFTCard
                    key={collection.id}
                    name={collection.name}
                    issuer={collection.issuer}
                    verified={false}
                    verificationMethod={collection.verificationMethod}
                    onVerify={() => handleVerify(collection)}
                    disabled={isVerifying}
                  />
                );
              })}
            </div>
          </section>

          {(reclaimError || proofError) && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-6 py-4 text-red-700 shadow-sm">
              <p className="font-semibold">Verification error</p>
              <p className="text-sm mt-1">{reclaimError || proofError}</p>
            </div>
          )}

          {(isSwitchingChain || submittingProof || isWriting || isConfirming) && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-6 py-4 text-blue-700 shadow-sm">
              <p className="font-semibold">
                {isSwitchingChain && "Switching to Rayls Devnet network..."}
                {!isSwitchingChain && submittingProof && !isWriting && "Preparing transaction..."}
                {!isSwitchingChain && isWriting && "Waiting for wallet signature..."}
                {!isSwitchingChain && isConfirming && "Transaction confirmed! Waiting for block confirmation..."}
              </p>
              {hash && (
                <p className="text-sm mt-1">
                  Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
                </p>
              )}
              {chainId !== raylsDevnet.id && !isSwitchingChain && (
                <p className="text-sm mt-1 text-amber-700">
                  ⚠️ Please ensure you're on Rayls Devnet network (Chain ID: {raylsDevnet.id}). Current: {chainId}
                </p>
              )}
            </div>
          )}

          {isTransactionSuccess && (
            <div className="rounded-2xl border border-green-200 bg-green-50/80 px-6 py-4 text-green-700 shadow-sm">
              <p className="font-semibold">✓ Verification successful!</p>
              <p className="text-sm mt-1">Your KYC NFT has been minted. Refreshing your credentials...</p>
            </div>
          )}

          {userNFTs.size === 0 && (
            <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle>No Tier 1 credentials yet</CardTitle>
                <CardDescription>
                  Complete any provider above to mint your first verification NFT.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {userNFTs.size > 0 && (
            <section className="space-y-4" id="verified-credentials">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">
                  Unlocked credentials
                </p>
                <h2 className="text-2xl font-semibold text-gray-900 mt-2">
                  Your Tier 1 KYC NFTs
                </h2>
                <p className="text-gray-600">
                  Proof of verification secured on-chain. Reuse across the entire Rayls ecosystem.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from(userNFTs.entries()).map(([collectionId, tokenId]) => {
                  const collection = VERIFICATION_COLLECTIONS.find(
                    (c) => c.id === collectionId
                  );
                  if (!collection) return null;

                  return (
                    <NFTCard
                      key={collectionId}
                      name={collection.name}
                      issuer={collection.issuer}
                      verified={true}
                      verificationMethod={collection.verificationMethod}
                      tokenId={tokenId}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

