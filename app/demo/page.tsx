"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VAULT_CONTRACT_ADDRESS, VAULT_ABI, NFT_CONTRACT_ADDRESS, NFT_ABI } from "@/lib/contracts";
import { parseEther } from "viem";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function DemoPage() {
  const { primaryWallet, user } = useDynamicContext();
  const walletConnected = (primaryWallet !== null || user)
  const { address } = useAccount();
  const [depositAmount, setDepositAmount] = useState("0.01");
  const [depositStatus, setDepositStatus] = useState<"idle" | "checking" | "failed" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Check if user has valid KYC NFT
  const { data: hasKYC, refetch: refetchKYC } = useReadContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "hasValidKYCNFT",
    args: address ? [address] : undefined,
    query: { enabled: !!address && walletConnected },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDeposit = async () => {
    if (!address) {
      setErrorMessage("Please connect your wallet");
      return;
    }

    setDepositStatus("checking");
    setErrorMessage("");

    // First check if user has KYC NFT
    const kycCheck = await refetchKYC();

    if (!kycCheck.data) {
      setDepositStatus("failed");
      setErrorMessage(
        "You need a valid KYC NFT to deposit. Please verify your identity first in the Tier 1 KYC Dashboard."
      );
      return;
    }

    try {
      writeContract({
        address: VAULT_CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        value: parseEther(depositAmount),
      });
    } catch (error: any) {
      setDepositStatus("failed");
      setErrorMessage(error.message || "Transaction failed");
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setDepositStatus("success");
    }
  }, [isSuccess]);

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
          <CardContent>
            <div className="flex items-center gap-3">
              {hasKYC ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <span className="text-green-700 font-medium">
                    You have a valid KYC NFT
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-700 font-medium">
                    No valid KYC NFT found
                  </span>
                </>
              )}
            </div>
            {!hasKYC && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Demo Flow:</strong> The deposit will fail first. Go to the Tier 1 KYC Dashboard,
                  verify your identity using Reclaim Protocol, then return here to successfully deposit.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deposit ETH</CardTitle>
            <CardDescription>
              Deposit ETH into the vault (requires KYC NFT)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.01"
              />
            </div>

            {depositStatus === "failed" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Deposit Failed</p>
                  <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
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
              disabled={isPending || isConfirming || depositStatus === "checking"}
              className="w-full"
              size="lg"
            >
              {isPending || isConfirming || depositStatus === "checking"
                ? "Processing..."
                : depositStatus === "success"
                ? "Deposit Successful"
                : "Deposit ETH"}
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

