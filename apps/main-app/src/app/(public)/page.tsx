"use client";

import React, { useState, useEffect } from 'react';
import Loader from '@/src/components/Loader';
import Link from "next/link";
import { Database, Link as ChainIcon, Wallet, ArrowRight } from "lucide-react";
import BorderGlow from '@/src/components/BorderGlow';

const LandingPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Loading Screen Overlay */}
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black z-[9999] transition-opacity duration-700 ease-in-out"
        style={{ 
          opacity: loading ? 1 : 0, 
          pointerEvents: loading ? "auto" : "none" 
        }}
      >
        <Loader />
      </div>

      {/* Main Page Layout */}
      <div className="relative min-h-screen text-white bg-black">
      {/* Hero Section (occupies full screen) */}
      <section className="relative h-screen flex flex-col justify-end pb-24 md:pb-32 pl-8 md:pl-24 overflow-hidden">
        {/* Background Video restricted to Hero */}
        <video
          src="/bg.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Gradient overlay seamlessly blending video into the black sections below */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black z-0 pointer-events-none" />

        <div className="max-w-3xl relative z-10 pointer-events-auto">
          <h1 className="text-5xl md:text-[5.5rem] font-bold text-white leading-[1.1] tracking-tighter mb-6">
            The Premier<br />
            x402 API<br />
            Marketplace
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
            Powering seamless data access, historical APIs, and AI integrations to make building simpler and enable developers to ship faster.
          </p>
          <Link href="/signin">
            <button className="bg-white text-black font-bold py-4 px-10 rounded-full text-base hover:bg-gray-200 transition-colors cursor-pointer inline-flex items-center gap-3">
              Get started <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative bg-zinc-950/80 backdrop-blur-md py-32 px-8 md:px-24 rounded-t-[3rem] border-t border-zinc-800 shadow-[0_-15px_40px_rgba(0,0,0,0.5)] z-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Built for the next generation of Web3.</h2>
            <p className="text-gray-400 text-xl leading-relaxed">
              Everything you need to orchestrate data across chains, manage endpoints, and confidently scale your dApps out of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1: API Marketplace */}
            <BorderGlow borderRadius={24} backgroundColor="#121214" edgeSensitivity={40} className="h-full">
              <div className="p-8 flex flex-col items-start gap-6 h-full">
                <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-center">
                  <Database size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight mb-3">API Marketplace</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Discover, test, and integrate premium endpoint APIs instantly. Get deep access to historical data feeds and specialized infrastructure easily.
                  </p>
                </div>
              </div>
            </BorderGlow>

            {/* Feature 2: Multi-Chain & Tokens */}
            <BorderGlow borderRadius={24} backgroundColor="#121214" edgeSensitivity={40} className="h-full">
              <div className="p-8 flex flex-col items-start gap-6 h-full">
                <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-center">
                  <ChainIcon size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight mb-3">Chains & Tokens</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Natively built for a multi-chain world. Easily track metrics and manage distinct blockchains alongside supported asset tokens within integrations.
                  </p>
                </div>
              </div>
            </BorderGlow>

            {/* Feature 3: Wallet Integrations */}
            <BorderGlow borderRadius={24} backgroundColor="#121214" edgeSensitivity={40} className="h-full">
              <div className="p-8 flex flex-col items-start gap-6 h-full">
                <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-center">
                  <Wallet size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight mb-3">Wallet Management</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Connect supported wallets and abstract away complexity. Track your usage, limits, and authentication seamlessly in your personal dashboard.
                  </p>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-[#000000] py-14 px-8 md:px-24 border-t border-zinc-900 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tighter text-white">Flow402</span>
            <span className="hidden md:inline-block text-zinc-700 mx-2">|</span>
            <span className="text-sm text-zinc-500">© {new Date().getFullYear()} Flow402. All rights reserved.</span>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-sm font-semibold text-zinc-400">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/signin" className="hover:text-white transition">Marketplace</Link>
            <Link href="#" className="hover:text-white transition">Documentation</Link>
            <Link href="#" className="hover:text-white transition">Support</Link>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

export default LandingPage