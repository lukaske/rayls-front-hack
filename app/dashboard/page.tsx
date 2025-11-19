"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { NFTCard } from "@/components/nft-card";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationOverlay } from "@/components/verification-overlay";
import { NFT_CONTRACT_ADDRESS, NFT_ABI } from "@/lib/contracts";
import { useState, useEffect } from "react";
import { parseEther } from "viem";
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
  const { writeContract } = useWriteContract();
  const [userNFTs, setUserNFTs] = useState<Map<string, string>>(new Map());
  const [verifying, setVerifying] = useState<string | null>(null);
  const { 
    proofs, 
    isLoading: reclaimLoading, 
    isWaitingForMobile,
    isVerified,
    error: reclaimError, 
    startVerification,
    cancelVerification
  } = useReclaim();
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
  const { data: coinbaseBalance } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    // Fetch user's NFTs
    // This is a simplified version - you'd need to query all token IDs
    if (address && coinbaseBalance && Number(coinbaseBalance) > 0) {
      // In a real implementation, you'd fetch all token IDs
      setUserNFTs((prev) => {
        const newMap = new Map(prev);
        newMap.set("coinbase-kyc", "1"); // Mock token ID
        return newMap;
      });
    }
  }, [address, coinbaseBalance]);

  // Handle proofs when they're received
  useEffect(() => {
    if (proofs && address && verifying) {
      // Convert proofs to a format suitable for the contract
      // The exact format depends on your contract's requirements
      const proofString = JSON.stringify(proofs);
      
      // Mint NFT with proof
      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: "mint",
        args: [address, proofString],
      });

      // Find the collection being verified and mark it as verified
      const collection = VERIFICATION_COLLECTIONS.find(c => c.id === verifying);
      if (collection) {
        setUserNFTs((prev) => {
          const newMap = new Map(prev);
          // Generate a token ID (in production, you'd get this from the mint transaction)
          newMap.set(collection.id, Date.now().toString());
          return newMap;
        });
      }

      setVerifying(null);
    }
  }, [proofs, address, verifying, writeContract]);

  // Handle errors
  useEffect(() => {
    if (reclaimError) {
      console.error("Verification error:", reclaimError);
      setVerifying(null);
    }
  }, [reclaimError]);

  const handleVerify = async (collection: VerificationCollection) => {
    if (!address) return;

    setVerifying(collection.id);
    await startVerification(collection.verificationMethod);
  };

  const handleCancelVerification = () => {
    cancelVerification();
    setVerifying(null);
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

          {reclaimError && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-6 py-4 text-red-700 shadow-sm">
              <p className="font-semibold">Verification error</p>
              <p className="text-sm mt-1">{reclaimError}</p>
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

