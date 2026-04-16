"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  User,
  Mail,
  ShieldCheck,
  Wallet,
  LogOut,
  ExternalLink
} from "lucide-react";
import { cn } from "@/src/lib/utils";

const ProfilePage = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    toast.loading("Signing out...", { id: "logout" });

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

  if (isPending || !mounted) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12 mt-10">
        <div className="flex items-start gap-6 pb-8 border-b border-border">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const initials = session.user.name 
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : session.user.email[0].toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-12 mt-4">
      {/* --- Profile Header --- */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-border pb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-secondary border border-border flex items-center justify-center text-3xl font-semibold text-foreground">
            {initials}
          </div>
          {session.user.emailVerified && (
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-emerald-500 shadow-sm ring-2 ring-background">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        
        <div className="text-center md:text-left space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {session.user.name || "Anonymous User"}
          </h1>
          <p className="text-muted-foreground text-sm flex items-center justify-center md:justify-start gap-2 h-6">
            <Mail className="w-4 h-4 text-muted-foreground/70" />
            {session.user.email}
          </p>
          <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2">
            {session.user.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                Verified Account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 text-xs font-semibold">
                Pending Verification
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- Main Content Sections --- */}
      <div className="space-y-12">
        
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">General Profile</h2>
            <p className="text-sm text-muted-foreground">
              Manage your core account information and preferences.
            </p>
          </div>
          <div className="flex flex-col border-y border-border">
            <ProfileRow 
              icon={<User className="w-4 h-4 text-muted-foreground" />}
              label="Full Name"
              value={session.user.name || "No name set"}
            />
            <ProfileRow 
              icon={<Mail className="w-4 h-4 text-muted-foreground" />}
              label="Email Address"
              value={session.user.email}
              isHighlight={true}
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
               Web3 Connections
            </h2>
            <p className="text-sm text-muted-foreground">
              Securely connect and control which crypto wallets are linked to your identity.
            </p>
          </div>
          <div>
            <Link href="/wallets" className="block outline-none ring-0">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-background flex items-center justify-center border border-border mt-0.5">
                    <Wallet className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Manage Wallets</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">View connected wallets</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </section>

        {/* Danger Zone / Log Out */}
        <section className="space-y-6 pt-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-destructive">Session Management</h2>
            <p className="text-sm text-muted-foreground">
               Terminating your session will revoke local access until you sign in again.
            </p>
          </div>
          <div>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="px-6 h-10 text-sm font-semibold rounded-md flex items-center gap-2 transition-all shadow-sm"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Terminating...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Sign Out Securely
                </>
              )}
            </Button>
          </div>
        </section>

      </div>
      
      {/* --- Footer --- */}
      <div className="text-center pt-8 pb-4 border-t border-border mt-8">
         <Link href={process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.flow402.com"} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2">
          Platform Documentation <ExternalLink className="w-3 h-3" />
        </Link>
        <p className="text-[11px] text-muted-foreground font-medium">Flow402 Protocol v1.4.2</p>
      </div>
    </div>
  );
};

// --- Helper Components ---

const ProfileRow = ({ 
  icon, 
  label, 
  value, 
  isHighlight = false,
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  isHighlight?: boolean;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 border-b border-border last:border-0 grow">
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-medium text-foreground">
        {label}
      </span>
    </div>
    <div className={cn(
      "font-semibold text-sm sm:text-right pl-7 sm:pl-0",
      isHighlight ? "text-foreground" : "text-muted-foreground"
    )}>
      {value}
    </div>
  </div>
);

export default ProfilePage;
