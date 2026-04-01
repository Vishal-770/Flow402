"use client";

import Link from "next/link";
import React, { useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ModeToggle } from "@/src/components/ModeToggle";
import { Loader2 } from "lucide-react";

const Navbar = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    toast.loading("Signing out...", { id: "logout" });

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

  return (
    <nav className="fixed top-0 left-0 lg:left-72 right-0 z-50 flex items-center justify-between h-16 px-6 md:px-12 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <img src="/logo.png" alt="Flow402" className="h-7 w-auto" />
          <span className="text-xl font-bold tracking-tight text-foreground">
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
  );
};

export default Navbar;
