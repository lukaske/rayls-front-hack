"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle2, Building2, ExternalLink } from "lucide-react";
import { SiCoinbase, SiBinance, SiX } from "react-icons/si";
import { HiOutlineSparkles } from "react-icons/hi";
import { ComponentType } from "react";
import { NFT_CONTRACT_ADDRESS } from "@/lib/contracts";

interface NFTCardProps {
  name: string;
  issuer: string;
  verified: boolean;
  verificationMethod: string;
  tokenId?: string;
  onVerify?: () => void;
  disabled?: boolean;
}

// Helper function to get the appropriate icon based on verification method
function getProviderIcon(verificationMethod: string): ComponentType<{ className?: string }> {
  const method = verificationMethod.toLowerCase();
  if (method === 'coinbase') return SiCoinbase;
  if (method === 'binance') return SiBinance;
  if (method === 'x' || method === 'twitter') return SiX;
  return HiOutlineSparkles; // Default icon for example/other
}

// Helper function to get the color for each provider
function getProviderColor(verificationMethod: string): string {
  const method = verificationMethod.toLowerCase();
  if (method === 'coinbase') return 'text-[#0052FF]'; // Coinbase blue
  if (method === 'binance') return 'text-[#F0B90B]'; // Binance yellow/gold
  if (method === 'x' || method === 'twitter') return 'text-black'; // X/Twitter black
  return 'text-purple-600'; // Default purple for example/other
}

export function NFTCard({
  name,
  issuer,
  verified,
  verificationMethod,
  tokenId,
  onVerify,
  disabled = false,
}: NFTCardProps) {
  const ProviderIcon = getProviderIcon(verificationMethod);
  const iconColor = getProviderColor(verificationMethod);
  
  if (verified) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="relative overflow-hidden border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 animate-pulse" />
          
          {/* 3D effect with perspective */}
          <div className="relative transform-gpu perspective-1000">
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-white/80 p-2 flex items-center justify-center shadow-md">
                  <ProviderIcon className={`w-8 h-8 ${iconColor}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {name}
                  </CardTitle>
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </motion.div>
              </div>
              <CardDescription className="text-gray-600 mt-2">
                Verified by {issuer}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Building2 className="w-4 h-4" />
                  <span>Verification Method: {verificationMethod}</span>
                </div>
                {tokenId && (
                  <div className="text-xs text-gray-500 font-mono bg-white/50 p-2 rounded flex items-center justify-between gap-2">
                    <span>Token ID: {tokenId}</span>
                    <a
                      href={`https://devnet-explorer.rayls.com/token/${NFT_CONTRACT_ADDRESS}/instance/${tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs">View on Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div className="pt-4 border-t border-blue-200">
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Accepted by:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Vault Deposit
                    </span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      DeFi Protocols
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-gray-100 p-2 flex items-center justify-center">
            <ProviderIcon className={`w-8 h-8 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <CardTitle>{name}</CardTitle>
          </div>
        </div>
        <CardDescription>Issued by {issuer}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Verify your identity using {verificationMethod} to receive this NFT.
          </p>
          <button
            onClick={onVerify}
            disabled={disabled}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disabled ? "Verifying..." : "Verify Now"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

