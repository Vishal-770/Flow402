"use client";

import Link from "next/link";
import React, { useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { ModeToggle } from "@/src/components/ModeToggle";
import { Loader2, Menu, LayoutDashboard, ShoppingBag, Code2, Coins, Link2, Wallet, User, PlusCircle } from "lucide-react";
import Loader from "@/src/components/Loader";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";

import Image from "next/image";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "My API Listings", href: "/api-endpoints", icon: Code2 },
  { name: "Tokens", href: "/tokens", icon: Coins },
  { name: "Chains", href: "/chains", icon: Link2 },
  { name: "Wallets", href: "/wallets", icon: Wallet },
  { name: "Profile", href: "/profile", icon: User },
];

const Navbar = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setIsMounted(true);
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

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md transition-all">
          <Loader />
          <h2 className="text-2xl font-bold tracking-tight text-foreground mt-4">Signing out</h2>
          <p className="text-muted-foreground text-sm mt-2">Disconnecting your session...</p>
        </div>
      )}
      <nav className="fixed top-0 left-0 lg:left-72 right-0 z-50 flex items-center justify-between h-16 px-6 md:px-12 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Mobile Hamburger Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0 -ml-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-background">
              <SheetHeader className="h-16 px-6 border-b border-border flex justify-center text-left m-0 space-y-0">
                <SheetTitle className="flex items-center gap-2">
                  <Image src="/logo.png" alt="Flow402" width={28} height={28} className="h-7 w-auto dark:invert" />
                  <span className="text-lg font-bold tracking-tight text-foreground">
                    Flow402
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
                <div className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Main Menu
                  </p>
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                          isActive
                            ? "bg-accent text-accent-foreground font-semibold"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        }`}
                      >
                        <link.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-accent-foreground" : "text-muted-foreground"}`} />
                        <span className="text-sm">{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="pt-4 border-t border-border space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Actions
                  </p>
                  <Link
                    href="/api-endpoints/create"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 font-medium text-sm"
                  >
                    <PlusCircle className="h-4 w-4 shrink-0" />
                    Register API
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <Image src="/logo.png" alt="Flow402" width={28} height={28} className="h-7 w-auto dark:invert" />
            <span className="text-xl font-bold tracking-tight text-foreground hidden sm:block">
              Flow402
            </span>
          </Link>
        </div>

      <div className="flex items-center gap-2 md:gap-3">
        <ModeToggle />
        {!isMounted || isPending ? (
          <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
        ) : session ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-accent border border-border transition-colors"
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
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign Out"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/signin">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
    </>
  );
};

export default Navbar;
