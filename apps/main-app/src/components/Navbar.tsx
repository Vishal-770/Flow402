"use client";

import Link from "next/link";
import React, { useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const Navbar = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    toast.loading("Signing out...", { id: "logout" });

    // Add a small delay for smooth experience
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully", { id: "logout" });
          setTimeout(() => {
            router.push("/signin");
            router.refresh();
          }, 500);
        },
        onError: () => {
          setIsLoggingOut(false);
          toast.error("Failed to sign out", { id: "logout" });
        },
      },
    });
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "My APIs", href: "/api-endpoints" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-6 md:px-12 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            F
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Flow402
          </span>
        </Link>
        <div className="hidden lg:flex items-center space-x-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-all"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isPending ? (
          <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
        ) : session ? (
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted border border-border transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                {session.user.name?.[0] || session.user.email[0]}
              </div>
              <span className="text-sm font-medium max-w-[120px] truncate">
                {session.user.name || session.user.email.split("@")[0]}
              </span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              {isLoggingOut ? (
                <Loader2 />
              ) : (
                "Sign Out"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/signin">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

const Loader2 = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);


export default Navbar;
