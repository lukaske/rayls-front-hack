"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Landmark, Building2, Building, FileCheck2, Camera, Lock, CheckCircle2 } from "lucide-react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccount, useReadContract } from "wagmi";
import { Address } from "viem";
import { NFT_CONTRACT_ADDRESS, NFT_ABI } from "@/lib/contracts";
import { NFTCard } from "@/components/nft-card";

type DocumentType = "passport";

interface Provider {
  id: string;
  name: string;
  legalEntity: string;
  description: string;
  icon: typeof Landmark;
  sandboxEndpoint: string;
  accent: string;
  status: "Live" | "Pilot" | "Requested";
}

const FIXED_INFO = {
  firstName: "David",
  lastName: "Benedict",
  dob: "1987-08-11",
  issuedDate: "2006-09-17",
  validUntil: "2016-06-17",
  number: "GBR8412036M1806287",
  placeOfBirth: "LONDON",
  country: "GBR"
};

const PROVIDERS: Provider[] = [
  {
    id: "deutsche-bank",
    name: "Deutsche Bank",
    legalEntity: "Deutsche Bank AG",
    description: "Rayls-local sandbox for German Tier 2 approvals.",
    icon: Landmark,
    sandboxEndpoint: "http://localhost:5000/api/applicants",
    accent: "from-sky-500 to-blue-600",
    status: "Live",
  },
  {
    id: "jp-morgan",
    name: "J.P. Morgan",
    legalEntity: "J.P. Morgan Chase & Co.",
    description: "Institutional onboarding for USD liquidity programs.",
    icon: Building2,
    sandboxEndpoint: "http://localhost:5000/api/jpm/applicants",
    accent: "from-indigo-500 to-violet-600",
    status: "Pilot",
  },
  {
    id: "dbs-bank",
    name: "DBS Bank",
    legalEntity: "DBS Group Holdings",
    description: "APAC treasury partner with MAS-aligned checks.",
    icon: Building,
    sandboxEndpoint: "http://localhost:5000/api/dbs/applicants",
    accent: "from-emerald-500 to-teal-600",
    status: "Requested",
  },
];

// Only passport label remains
const DOC_LABELS: Record<DocumentType, string> = {
  passport: "Passport",
};

export default function Tier2DashboardPage() {
  const { primaryWallet, user } = useDynamicContext();
  const walletConnected = Boolean(primaryWallet || user);
  const { address } = useAccount();

  // Only track passport now
  const [documents, setDocuments] = useState<Record<DocumentType, File | null>>({
    passport: null,
  });

  const [documentStatus, setDocumentStatus] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState(PROVIDERS[0].id);
  const [requestNote, setRequestNote] = useState("");
  const [requestStatus, setRequestStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [tier2NFTs, setTier2NFTs] = useState<Map<string, string>>(new Map());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const selectedProvider = useMemo(
    () => PROVIDERS.find((provider) => provider.id === selectedProviderId) ?? PROVIDERS[0],
    [selectedProviderId]
  );

  // Check if user has KYC NFT
  const { data: hasKYCNFT } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: "hasKYCNFT",
    args: address ? [address] : undefined,
    query: { enabled: !!address && walletConnected },
  });

  // Get token ID by address if user has NFT
  const { data: tokenId } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: "getTokenIdByAddress",
    args: address ? [address] : undefined,
    query: { enabled: !!address && walletConnected && hasKYCNFT === true },
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

  // Fetch Tier 2 NFTs when balance changes
  useEffect(() => {
    if (address && hasKYCNFT && tokenId !== null && tokenId !== undefined && Number(tokenId) > 0) {
      // Determine if this is a Tier 2 NFT based on platform from KYC data
      setTier2NFTs((prev) => {
        const newMap = new Map(prev);

        // If we have KYC data, check if it's a Tier 2 platform
        if (kycData && typeof kycData === 'object' && 'platform' in kycData && kycData.platform) {
          const platform = String(kycData.platform).toLowerCase();

          // Check if platform matches any Tier 2 provider
          const tier2Provider = PROVIDERS.find(p =>
            p.id.toLowerCase() === platform ||
            platform.includes(p.id.toLowerCase()) ||
            platform.includes(p.name.toLowerCase())
          );

          if (tier2Provider && !newMap.has(tier2Provider.id)) {
            newMap.set(tier2Provider.id, tokenId.toString());
          }
        }

        return newMap;
      });
    }
  }, [address, hasKYCNFT, tokenId, kycData]);

  const allDocumentsProvided = useMemo(
    () => Object.values(documents).every((file) => !!file),
    [documents]
  );

  const handleDocumentUpload = (type: DocumentType, fileList: FileList | null) => {
    if (!fileList?.[0]) return;
    const file = fileList[0];
    setDocuments((prev) => ({ ...prev, [type]: file }));
    setDocumentStatus(`${DOC_LABELS[type]} encrypted & staged (${file.name})`);
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
    } catch (error: any) {
      setCameraError(error?.message ?? "Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureSelfie = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/webp");
    setSelfieDataUrl(dataUrl);
    stopCamera();
  };

  const startLivelinessSequence = async () => {
    if (countdownRef.current) return;
    setSelfieDataUrl(null);
    await startCamera();
    setCountdown(4);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (!prev || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          captureSelfie();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestSubmission = async () => {
    if (!allDocumentsProvided) {
      setRequestMessage("Please upload both required PDFs before sending the request.");
      return;
    }
    if (!selfieDataUrl) {
      setRequestMessage("Complete the liveliness selfie capture to continue.");
      return;
    }
    if (!address) {
      setRequestMessage("Please ensure your wallet is connected.");
      return;
    }

    setRequestStatus("submitting");
    setRequestMessage(null);

    try {
      const requestBody = {
        to: address,
        firstName: FIXED_INFO.firstName,
        lastName: FIXED_INFO.lastName,
        kycStatus: "verified",
        platform: selectedProviderId,
      };

      // Submit passport file and fixed info to selected provider's sandboxEndpoint
      const formData = new FormData();
      formData.append("firstName", FIXED_INFO.firstName);
      formData.append("lastName", FIXED_INFO.lastName);
      formData.append("dob", FIXED_INFO.dob);
      formData.append("issuedDate", FIXED_INFO.issuedDate);
      formData.append("validUntil", FIXED_INFO.validUntil);
      formData.append("number", FIXED_INFO.number);
      formData.append("placeOfBirth", FIXED_INFO.placeOfBirth);
      formData.append("country", FIXED_INFO.country);
      if (documents.passport) {
        formData.append("passport", documents.passport);
      }

      // Optionally include note and selfie
      if (requestNote) formData.append("note", requestNote);
      if (selfieDataUrl) {
        // Convert the dataURL to a Blob
        const response = await fetch(selfieDataUrl);
        const blob = await response.blob();
        formData.append("selfie", blob, "selfie.png");
      }

      const sandboxUrl = selectedProvider.sandboxEndpoint;
      const sandboxResp = await fetch(sandboxUrl, {
        method: "POST",
        body: formData,
      });

      if (!sandboxResp.ok) {
        let errorText = await sandboxResp.text();
        throw new Error(`Sandbox endpoint error: ${errorText}`);
      }

      console.log("Sending NFT mint request:", {
        url: "http://localhost:5000/api/nft/mint",
        body: requestBody,
      });

      // Call the NFT minting API
      const response = await fetch("http://localhost:5000/api/nft/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }).catch((fetchError) => {
        // Handle network errors (CORS, connection refused, etc.)
        console.error("Fetch error details:", {
          error: fetchError,
          message: fetchError.message,
          stack: fetchError.stack,
        });
        if (fetchError.message.includes("Failed to fetch") || fetchError.message.includes("NetworkError")) {
          throw new Error(
            "Unable to connect to the NFT minting service. Please ensure the backend server is running on localhost:5000 and CORS is properly configured."
          );
        }
        throw fetchError;
      });

      console.log("Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;
        try {
          const text = await response.text();
          console.error("Error response body:", text);
          try {
            errorData = JSON.parse(text);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // If not JSON, use the text as error message
            errorMessage = text || response.statusText || errorMessage;
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error("Request failed:", {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorData,
        });
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log("Response body:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.warn("Response is not JSON, treating as text:", responseText);
        result = { message: responseText, transactionHash: null, tokenId: null };
      }

      // Add the newly minted NFT to the tier2NFTs state
      if (result.success && result.tokenId) {
        setTier2NFTs((prev) => {
          const newMap = new Map(prev);
          newMap.set(selectedProviderId, result.tokenId.toString());
          return newMap;
        });
      }

      setRequestStatus("sent");
      setRequestMessage(
        `Tier 2 request securely delivered to ${selectedProvider.name}. NFT minted successfully!${result.transactionHash ? ` Transaction: ${result.transactionHash.slice(0, 10)}...${result.transactionHash.slice(-8)}` : ""}`
      );
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      setRequestStatus("idle");

      // Provide user-friendly error messages
      let errorMessage = error.message || "Unknown error occurred";

      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.includes("Unable to connect")) {
        errorMessage = "Unable to connect to the NFT minting service. Please ensure the backend server is running on localhost:5000 and CORS is properly configured.";
      } else if (errorMessage.includes("CORS")) {
        errorMessage = "CORS error: The backend server needs to allow requests from this origin.";
      }

      setRequestMessage(
        `Failed to mint NFT: ${errorMessage} Please try again or contact support if the issue persists.`
      );
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!walletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,176,255,0.25),_transparent_60%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(12,255,205,0.2),_transparent_65%)] blur-3xl" />
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <Card className="max-w-md mx-auto bg-white/95 border-white/30 shadow-2xl shadow-cyan-500/20">
            <CardHeader className="space-y-3">
              <CardTitle>Please connect your wallet</CardTitle>
              <CardDescription>
                Connect a wallet to unlock the Tier 2 dashboard and start your institutional KYC flow.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,176,255,0.25),_transparent_55%)]" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(12,255,205,0.15),_transparent_60%)] blur-3xl" />
      <Navbar />
      <main className="relative z-10 container mx-auto px-4 py-12 space-y-12">
        <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] items-center">
          <div className="space-y-6 text-white">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">
              Tier 2 Institutional KYC
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
              Upload sovereign-grade identity once. Stream encrypted dossiers to every tenant.
            </h1>
            <p className="text-lg text-slate-200">
              Rayls Tier 2 introduces document-level verification with encrypted storage, liveliness checks,
              and direct rails into major banks. Institutions issue NFTs once they complete their review,
              keeping your credentials portable.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-cyan-200">Encrypted custody</p>
                  <p className="text-sm text-white">Docs sealed at rest with AES-256</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 flex items-center gap-3">
                <Camera className="h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-200">Liveliness</p>
                  <p className="text-sm text-white">Selfie capture with local processing</p>
                </div>
              </div>
            </div>
          </div>
          <Card className="bg-white/90 border-white/30 shadow-2xl shadow-cyan-500/20">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Applicant profile</CardTitle>
              </div>
              <Button variant="outline" size="sm" className="mt-2 sm:mt-0">
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              {(Object.entries(FIXED_INFO) as [keyof typeof FIXED_INFO, string][]).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-slate-100 pb-2 text-sm last:border-none last:pb-0">
                  <span className="capitalize text-slate-500">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <Card className="border border-cyan-100/60 bg-white/95 shadow-xl shadow-slate-900/10">
            <CardHeader>
              <CardTitle>Upload government document</CardTitle>
              <CardDescription>
                PDF is encrypted client-side and stored inside Rayls secure custody.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(["passport"] as DocumentType[]).map((type) => (
                <label
                  key={type}
                  className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 cursor-pointer hover:border-cyan-300 hover:bg-white transition"
                >
                  <span className="text-sm font-medium text-slate-700">{DOC_LABELS[type]}</span>
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/jpg"
                    className="text-xs text-slate-500"
                    onChange={(event) => handleDocumentUpload(type, event.target.files)}
                  />
                  {documents[type] && (
                    <p className="text-xs text-emerald-600 flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4" />
                      {documents[type]?.name}
                    </p>
                  )}
                </label>
              ))}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex items-start gap-3 text-sm text-emerald-900">
                <Lock className="h-5 w-5 text-emerald-600" />
                <p>
                  Each PDF is encrypted before leaving your browser. Only shortlisted tenants receive a decrypt
                  token once you approve a request.
                </p>
              </div>
              {documentStatus && (
                <p className="text-xs text-cyan-700 bg-cyan-50/80 border border-cyan-100 rounded-xl px-3 py-2">
                  {documentStatus}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-emerald-100/60 bg-white/95 shadow-xl shadow-slate-900/10">
            <CardHeader className="space-y-1">
              <CardTitle>Liveliness selfie</CardTitle>
              <CardDescription>
                Capture a short selfie clip or frame on your laptop camera. Stored encrypted alongside PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`rounded-2xl overflow-hidden relative ${
                  selfieDataUrl ? "border border-slate-200 bg-black/90" : "border border-dashed border-slate-200 bg-slate-50"
                }`}
              >
                {!selfieDataUrl && (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover bg-slate-900/90"
                      autoPlay
                      playsInline
                      muted
                    />
                    {countdown !== null && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 text-white gap-3 p-6 text-center">
                        <span className="text-6xl font-semibold">{countdown}</span>
                        <span className="text-base font-medium tracking-wide">
                          Rotate your head slowly left ↔ right until the timer ends
                        </span>
                      </div>
                    )}
                  </>
                )}
                {selfieDataUrl && (
                  <img src={selfieDataUrl} alt="Captured selfie" className="w-full h-64 object-cover" />
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={startLivelinessSequence} variant="default" disabled={!!countdownRef.current}>
                  Start liveliness check
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    stopCamera();
                    setSelfieDataUrl(null);
                  }}
                >
                  Reset
                </Button>
              </div>
              {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}
              {countdown !== null ? (
                <p className="text-xs text-emerald-600">
                  Keep rotating your head left and right for the full 5-second timer to confirm liveliness.
                </p>
              ) : (
                !selfieDataUrl && (
                  <p className="text-xs text-slate-500">
                    Your camera feed never leaves the browser; only the encrypted still frame is uploaded.
                  </p>
                )
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <CardHeader>
              <CardTitle>Send Tier 2 requests</CardTitle>
              <CardDescription>Push dossiers to banks & institutions straight from Rayls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tenant</label>
                <select
                  value={selectedProviderId}
                  onChange={(event) => setSelectedProviderId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {PROVIDERS.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} · {provider.status}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Requests are delivered to {selectedProvider.legalEntity}.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Message (optional)</label>
                <textarea
                  value={requestNote}
                  onChange={(event) => setRequestNote(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-[120px]"
                  placeholder="Add additional onboarding context for the tenant reviewer..."
                />
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  selfieDataUrl ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <CheckCircle2
                  className={`h-4 w-4 ${selfieDataUrl ? "text-emerald-500" : "text-slate-300"}`}
                />
                <span>
                  {selfieDataUrl ? "Liveliness check passed" : "Finish the liveliness check to mark it complete"}
                </span>
              </div>
              <Button
                size="lg"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={handleRequestSubmission}
                disabled={requestStatus === "submitting" || !selfieDataUrl}
              >
                {requestStatus === "submitting" ? "Encrypting payload..." : "Send encrypted KYC package"}
              </Button>
              {requestMessage && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    requestStatus === "sent"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{requestMessage}</div>
                  {requestStatus !== "sent" && requestMessage.includes("Unable to connect") && (
                    <div className="mt-3 pt-3 border-t border-red-200 text-xs text-red-700">
                      <p className="font-medium mb-2">Troubleshooting steps:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Ensure the backend server is running on port 5000</li>
                        <li>Check that CORS is enabled for your frontend origin</li>
                        <li>Verify the API endpoint is correct: /api/nft/mint</li>
                        <li>Check browser console for detailed error messages</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <CardHeader>
              <CardTitle>Institutional tenants</CardTitle>
              <CardDescription>Banks mint NFTs once they finalize compliance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {PROVIDERS.map((provider) => {
                const Icon = provider.icon;
                return (
                  <div
                    key={provider.id}
                    className="rounded-2xl border border-slate-100 p-4 flex items-start gap-4 hover:border-cyan-200 transition"
                  >
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${provider.accent} text-white flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">{provider.name}</p>
                        <span className="text-xs rounded-full border px-2 py-0.5 border-slate-200 text-slate-500">
                          {provider.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{provider.description}</p>
                      <p className="text-xs text-slate-400">
                        {provider.legalEntity} · Issues Rayls Tier 2 NFTs post-review
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {tier2NFTs.size === 0 && (
          <Card className="border-dashed border-2 border-cyan-200 bg-cyan-50/50">
            <CardHeader>
              <CardTitle>No Tier 2 credentials yet</CardTitle>
              <CardDescription>
                Complete a Tier 2 request above to receive your institutional NFT from the selected tenant.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {tier2NFTs.size > 0 && (
          <section className="space-y-4" id="tier2-credentials">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
                Institutional credentials
              </p>
              <h2 className="text-2xl font-semibold text-white mt-2">
                Your Tier 2 KYC NFTs
              </h2>
              <p className="text-slate-200">
                Proof of institutional verification secured on-chain. Reuse across the entire Rayls ecosystem.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from(tier2NFTs.entries()).map(([providerId, tokenId]) => {
                const provider = PROVIDERS.find((p) => p.id === providerId);
                if (!provider) return null;

                return (
                  <NFTCard
                    key={providerId}
                    name={`${provider.name} Tier 2 Verified`}
                    issuer={provider.legalEntity}
                    verified={true}
                    verificationMethod={provider.id}
                    tokenId={tokenId}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

