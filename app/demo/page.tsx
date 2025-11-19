"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KYC_POOL_CONTRACT_ADDRESS, KYC_POOL_ABI, NFT_CONTRACT_ADDRESS, NFT_ABI } from "@/lib/contracts";
import { parseEther, formatEther } from "viem";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { raylsDevnet } from "@/lib/chains";
import Link from "next/link";

export default function DemoPage() {
  const { primaryWallet, user } = useDynamicContext();
  const walletConnected = Boolean(primaryWallet || user)
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const [depositAmount, setDepositAmount] = useState("0.01");
  const [depositStatus, setDepositStatus] = useState<"idle" | "checking" | "failed" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Check if user can deposit (has KYC NFT)
  const { data: canDeposit, refetch: refetchCanDeposit } = useReadContract({
    address: KYC_POOL_CONTRACT_ADDRESS,
    abi: KYC_POOL_ABI,
    functionName: "canDeposit",
    args: address ? [address] : undefined,
    query: { enabled: !!address && walletConnected },
  });

  // Get user's current deposit amount
  const { data: userDeposit, refetch: refetchUserDeposit } = useReadContract({
    address: KYC_POOL_CONTRACT_ADDRESS,
    abi: KYC_POOL_ABI,
    functionName: "getDeposit",
    args: address ? [address] : undefined,
    query: { enabled: !!address && walletConnected },
  });

  // Check if user has KYC NFT directly
  const { data: hasKYCNFT } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: "hasKYCNFT",
    args: address ? [address] : undefined,
    query: { enabled: !!address && walletConnected },
  });

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDeposit = async () => {
    if (!address) {
      setErrorMessage("Please connect your wallet");
      setDepositStatus("failed");
      return;
    }

    setDepositStatus("checking");
    setErrorMessage("");

    try {
      // Check if we're on the correct chain (Rayls Devnet)
      if (chainId !== raylsDevnet.id) {
        console.log(`Switching chain from ${chainId} to ${raylsDevnet.id}`);
        try {
          await switchChain({ chainId: raylsDevnet.id });
          // Wait a bit for the chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError: any) {
          setDepositStatus("failed");
          setErrorMessage(`Please switch to Rayls Devnet network. ${switchError.message || ''}`);
          return;
        }
      }

      // Check if user can deposit (has KYC NFT)
      const canDepositCheck = await refetchCanDeposit();
      
      if (!canDepositCheck.data) {
        setDepositStatus("failed");
        setErrorMessage(
          "You need a valid KYC NFT to deposit. Please verify your identity first in the Tier 1 KYC Dashboard."
        );
        return;
      }

      // Validate deposit amount
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        setDepositStatus("failed");
        setErrorMessage("Please enter a valid deposit amount");
        return;
      }

      // Submit deposit transaction
      writeContract({
        address: KYC_POOL_CONTRACT_ADDRESS,
        abi: KYC_POOL_ABI,
        functionName: "deposit",
        value: parseEther(depositAmount),
        chainId: raylsDevnet.id,
      });
    } catch (error: any) {
      console.error("Deposit error:", error);
      setDepositStatus("failed");
      
      // Parse error message to provide user-friendly feedback
      const errorMsg = error.message || error.toString() || "Transaction failed";
      
      // Check for common error patterns
      if (errorMsg.includes("KYC") || errorMsg.includes("NFT") || errorMsg.includes("not verified")) {
        setErrorMessage("❌ KYC NFT not found. Please verify your identity in the Tier 1 KYC Dashboard first.");
      } else if (errorMsg.includes("insufficient") || errorMsg.includes("balance")) {
        setErrorMessage("❌ Insufficient balance. Please ensure you have enough USDgas in your wallet.");
      } else if (errorMsg.includes("user rejected") || errorMsg.includes("denied")) {
        setErrorMessage("Transaction was cancelled. Please try again.");
      } else {
        setErrorMessage(`Transaction failed: ${errorMsg}`);
      }
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setDepositStatus("success");
      setErrorMessage("");
      // Refetch deposit amount after successful deposit
      refetchUserDeposit();
      refetchCanDeposit();
    }
  }, [isSuccess, refetchUserDeposit, refetchCanDeposit]);

  // Handle write contract errors
  useEffect(() => {
    if (writeError) {
      console.error("Write contract error:", writeError);
      setDepositStatus("failed");
      
      const errorMsg = writeError.message || writeError.toString() || "Transaction failed";
      
      // Check for NFT-related errors
      if (
        errorMsg.includes("KYC") || 
        errorMsg.includes("NFT") || 
        errorMsg.includes("not verified") ||
        errorMsg.includes("does not have") ||
        errorMsg.includes("missing")
      ) {
        setErrorMessage("❌ KYC NFT not found. You need to verify your identity first. Visit the Tier 1 KYC Dashboard to get verified.");
      } else if (errorMsg.includes("insufficient") || errorMsg.includes("balance")) {
        setErrorMessage("❌ Insufficient balance. Please ensure you have enough USDgas in your wallet.");
      } else if (errorMsg.includes("user rejected") || errorMsg.includes("denied")) {
        setErrorMessage("Transaction was cancelled. Please try again.");
      } else {
        setErrorMessage(`Transaction failed: ${errorMsg}`);
      }
    }
  }, [writeError]);

  if (!walletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Please Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your wallet to use the demo vault
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Vault Deposit Demo</h1>
          <p className="text-gray-600">
            This demo demonstrates KYC-gated deposits. You need a verified KYC NFT to deposit.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>KYC Status</CardTitle>
            <CardDescription>Your current KYC verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {canDeposit ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <span className="text-green-700 font-medium">
                    ✓ You have a valid KYC NFT - Deposits enabled
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-700 font-medium">
                    ✗ No valid KYC NFT found - Deposits disabled
                  </span>
                </>
              )}
            </div>
            
            {userDeposit !== undefined && userDeposit !== null && typeof userDeposit === 'bigint' && Number(userDeposit) > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Your Current Deposit</p>
                    <p className="text-lg font-semibold text-blue-700">
                      {formatEther(userDeposit)} USDgas
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!canDeposit && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>⚠️ KYC Verification Required:</strong> You need to verify your identity before you can deposit.
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="w-full">
                    Go to Tier 1 KYC Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deposit USDgas</CardTitle>
            <CardDescription>
              Deposit USDgas into the KYC Pool (requires verified KYC NFT)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount (USDgas)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={depositAmount}
                onChange={(e) => {
                  setDepositAmount(e.target.value);
                  setDepositStatus("idle");
                  setErrorMessage("");
                }}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.01"
                disabled={isPending || isConfirming || isSwitchingChain}
              />
            </div>

            {(isSwitchingChain || isPending || isConfirming) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800 font-medium">
                  {isSwitchingChain && "🔄 Switching to Rayls Devnet network..."}
                  {!isSwitchingChain && isPending && "⏳ Waiting for wallet signature..."}
                  {!isSwitchingChain && !isPending && isConfirming && "✅ Transaction confirmed! Waiting for block confirmation..."}
                </p>
                {chainId !== raylsDevnet.id && !isSwitchingChain && (
                  <p className="text-sm mt-1 text-amber-700">
                    ⚠️ Please ensure you&apos;re on Rayls Devnet network (Chain ID: {raylsDevnet.id})
                  </p>
                )}
              </div>
            )}

            {depositStatus === "failed" && errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Deposit Failed</p>
                  <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
                  {errorMessage.includes("KYC NFT") && (
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        Get Verified in Dashboard
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {depositStatus === "success" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium">Deposit Successful!</p>
                  <p className="text-green-600 text-sm mt-1">
                    Transaction hash: {hash?.slice(0, 10)}...
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleDeposit}
              disabled={isPending || isConfirming || depositStatus === "checking" || isSwitchingChain || !canDeposit}
              className="w-full"
              size="lg"
            >
              {isSwitchingChain
                ? "Switching Network..."
                : isPending || isConfirming || depositStatus === "checking"
                ? "Processing..."
                : depositStatus === "success"
                ? "Deposit Successful"
                : !canDeposit
                ? "KYC NFT Required"
                : "Deposit USDgas"}
            </Button>

            {hash && (
              <p className="text-xs text-gray-500 text-center">
                Transaction: {hash}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

