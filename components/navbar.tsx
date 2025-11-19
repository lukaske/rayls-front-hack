"use client";

import Link from "next/link";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900">
          Rayls <span className="text-blue-600">KYC</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
              Tier 1 KYC Dashboard
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

