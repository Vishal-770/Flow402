"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { ModeToggle } from "@/src/components/ModeToggle";
import { 
  Menu, 
  ChevronRight, 
  LayoutDashboard,
  LogOut,
  Loader2
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";
import { authClient } from "@/src/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Loader from "@/src/components/Loader";

const LandingNavbar = () => {
  const { data: session, isPending } = authClient.useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/signin");
          router.refresh();
        },
        onError: () => {
          setIsLoggingOut(false);
          toast.error("Failed to sign out");
        },
      },
    });
  };

  const navLinks = [
    { name: "Marketplace", href: "/marketplace" },
    { name: "Features", href: "/#features" },
    { name: "Docs", href: process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.flow402.com" },
  ];

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md transition-all">
          <Loader />
          <h2 className="text-2xl font-bold tracking-tight text-foreground mt-4">Signing out</h2>
          <p className="text-muted-foreground text-sm mt-2">Disconnecting your session...</p>
        </div>
      )}
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-border py-3"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/logo.png" alt="Flow402" width={100} height={32} className="h-8 w-auto transform group-hover:scale-105 transition-transform dark:invert" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Flow402
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ModeToggle />
          
          {isPending ? (
            <div className="h-9 w-24 animate-pulse bg-muted rounded-lg" />
          ) : session ? (
            <div className="flex items-center gap-2">
               <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost" size="sm" className="font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/signin">
                <Button size="sm" className="font-semibold px-5 rounded-lg">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-3">
          <ModeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="mb-8">
                <SheetTitle className="text-left flex items-center gap-2">
                  <Image src="/logo.png" alt="Flow402" width={100} height={32} className="h-8 w-auto dark:invert" />
                  Flow402
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-lg font-medium"
                  >
                    {link.name}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                ))}
                
                <div className="mt-8 pt-8 border-t border-border flex flex-col gap-4">
                  {session ? (
                    <>
                      <Link href="/dashboard" className="w-full">
                        <Button className="w-full py-6 text-lg rounded-xl flex gap-2">
                          <LayoutDashboard className="w-5 h-5" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        className="w-full py-6 text-lg rounded-xl gap-2"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/signin" className="w-full">
                        <Button variant="outline" className="w-full py-6 text-lg rounded-xl">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signin" className="w-full">
                        <Button className="w-full py-6 text-lg rounded-xl">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
    </>
  );
};

export default LandingNavbar;
