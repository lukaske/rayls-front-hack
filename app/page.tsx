import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Cobe } from "@/components/globe-background";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-90" />
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-br from-blue-100/50 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-br from-indigo-100/40 via-transparent to-transparent blur-3xl pointer-events-none" />
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1 text-sm font-medium text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Tier 1 KYC credentials, ready in minutes
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight tracking-tight text-slate-900">
                Compliance-grade onboarding for every DeFi vault.
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl">
                Rayls turns Reclaim Protocol proofs into reusable Tier 1 NFTs. Mint once, unlock every KYC-gated experience across Rayls Network without re-verifying.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="text-lg px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 font-semibold"
                >
                  Launch Tier 1 KYC Dashboard
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-6 border-2 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300 transition-all duration-300 font-semibold"
                >
                  Watch the vault demo
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Zero-knowledge verified
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                Dynamic wallet ready
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                NFT credentials you own
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-blue-400/30 rounded-3xl" />
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl shadow-blue-500/30 border border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                  Tier 1 readiness
                </p>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs border border-white/20">
                  Live on Rayls Network
                </span>
              </div>
              <h2 className="text-3xl font-semibold mt-6">
                Mint elite, multi-platform KYC NFTs
              </h2>
              <p className="text-white/80 mt-4">
                Coinbase, Binance, and custom verification flows powered by Reclaim Protocol. Reuse instantly across vaults, exchanges, and partner apps.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-xs uppercase text-white/70">Verified wallets</p>
                  <p className="text-3xl font-semibold">3,482</p>
                  <p className="text-sm text-white/70">Active Tier 1 NFT holders</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-xs uppercase text-white/70">Avg. verification</p>
                  <p className="text-3xl font-semibold">2m 41s</p>
                  <p className="text-sm text-white/70">Mobile-first experience</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-xs uppercase text-white/70">Partners</p>
                  <p className="text-3xl font-semibold">14</p>
                  <p className="text-sm text-white/70">Vaults + exchanges</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-xs uppercase text-white/70">Compliance tier</p>
                  <p className="text-3xl font-semibold">Tier 1</p>
                  <p className="text-sm text-white/70">Reclaim-backed proofs</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 text-sm text-white/80">
                <span className="h-10 w-10 rounded-full bg-white/10 border border-white/30 flex items-center justify-center font-semibold">
                  RY
                </span>
                <div>
                  <p className="font-semibold">Rayls Compliance Suite</p>
                  <p className="text-white/70">Audited quarterly · SOC 2 controls</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 space-y-10">
          <div className="flex flex-col items-center text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-blue-500">
              Trusted proof exchange
            </p>
            <h3 className="text-3xl md:text-4xl font-semibold text-slate-900">
              Connect once, carry your Tier 1 identity everywhere.
            </h3>
            <p className="text-lg text-slate-600 max-w-3xl">
              Every credential is backed by zero-knowledge proofs and stored as an NFT you control. Partners can verify instantly without touching raw data.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/50">
              <p className="text-sm uppercase tracking-wide text-slate-500">01 · Verify</p>
              <h4 className="text-xl font-semibold text-slate-900 mt-3">
                Complete Reclaim-powered checks
              </h4>
              <p className="text-slate-600 mt-3">
                Choose Coinbase, Binance, or your own provider inside the Tier 1 KYC Dashboard. Mobile handoff keeps proofs private.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/50">
              <p className="text-sm uppercase tracking-wide text-slate-500">02 · Mint</p>
              <h4 className="text-xl font-semibold text-slate-900 mt-3">
                Issue reusable NFT credentials
              </h4>
              <p className="text-slate-600 mt-3">
                A single mint unlocks Tier 1 access. Proof metadata stays encrypted while partners only see validity.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/50">
              <p className="text-sm uppercase tracking-wide text-slate-500">03 · Deploy</p>
              <h4 className="text-xl font-semibold text-slate-900 mt-3">
                Enter vaults & partner apps instantly
              </h4>
              <p className="text-slate-600 mt-3">
                Demo the vault, power institutional flows, and keep compliance proof synced across the Rayls ecosystem.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-2xl shadow-blue-100/60">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
                  Global verification map
                </p>
                <h3 className="text-3xl font-semibold text-slate-900">
                  See your network of Tier 1 users light up in real time.
                </h3>
                <p className="text-slate-600 text-lg">
                  The interactive Rayls Globe visualizes active credentials, partner vaults, and live verification sessions across continents.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                {/* Globe Below Title – untouched component */}
                <Cobe />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

