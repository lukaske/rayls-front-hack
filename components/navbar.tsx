"use client";

import Link from "next/link";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 transition-transform duration-300 group-hover:scale-110">
            <ShieldCheck className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Credentia <span className="text-blue-600">KYC</span>
            </span>
            <span className="text-sm font-medium text-gray-500">
              Identity on Rayls
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
              Tier 1 KYC
            </Button>
          </Link>
          <Link href="/tier2">
            <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
              Tier 2 KYC
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
              Demo
            </Button>
          </Link>
          <DynamicWidget />
        </div>
      </div>
    </nav>
  );
}

