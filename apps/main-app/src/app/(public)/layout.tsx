"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const PublicPageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Static top navbar */}
      <nav 
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 py-4 bg-transparent"
      >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Image
              src="/logo.png"
              alt="Flow402 Logo"
              width={100}
              height={32}
              className="h-8 w-auto"
              style={{ filter: "invert(1)" }}
              priority
            />
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.03em",
              }}
            >
              Flow402
            </span>
          </Link>

          {/* Get Started */}
          <Link href="/signin" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "#ffffff",
                color: "#000000",
                border: "none",
                borderRadius: "9999px",
                padding: "0.4rem 1.1rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Get Started
            </button>
          </Link>
        </nav>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default PublicPageLayout;
