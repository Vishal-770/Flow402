"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

// ─── Component ───────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // ─── Loading ────────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Account</h1>
            <p className="text-muted-foreground">
              Manage your personal information and verification status.
            </p>
          </div>

          {session && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* User Information Card */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="tracking-tight">Account Information</CardTitle>
                  <CardDescription>
                    Your primary account details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1.5 px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Display Name
                    </label>
                    <p className="font-semibold text-foreground">
                      {session.user.name || "Not provided"}
                    </p>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="space-y-1.5 px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Email Address
                    </label>
                    <p className="font-semibold text-foreground">
                      {session.user.email}
                    </p>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="space-y-1.5 px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Verification Status
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {session.user.emailVerified ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-[11px] font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          VERIFIED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 text-[11px] font-bold">
                          NOT VERIFIED
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions Card */}
              <Card className="border-border flex flex-col">
                <CardHeader>
                  <CardTitle className="tracking-tight">Preferences</CardTitle>
                  <CardDescription>
                    Manage your active session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-1.5 px-1">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Security and sensitive data changes require additional verification steps. Contact support if you need to update restricted fields.
                    </p>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="pt-2 space-y-3">
                    <Link href="/wallets" className="block">
                      <Button variant="outline" className="w-full rounded-xl h-11 font-semibold group transition-all">
                        Manage Wallets
                        <ChevronRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="w-full rounded-xl h-11 font-semibold shadow-sm"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          SIGNING OUT...
                        </>
                      ) : (
                        "SIGN OUT"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
