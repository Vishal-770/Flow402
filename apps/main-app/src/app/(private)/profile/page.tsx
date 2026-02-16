"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { authClient } from "@/src/lib/auth-client";
import { useConnectWallet, useWallets } from "@privy-io/react-auth";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import { toast } from "sonner";
import {
  Wallet,
  Copy,
  Check,
  Loader2,
  Trash2,
  Link as LinkIcon,
  CheckCircle2,
  Unplug,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WalletRow {
  id: string;
  address: string;
  createdAt: string;
}

interface WalletsApiResponse {
  success: boolean;
  data: WalletRow[];
}

interface SaveWalletResponse {
  success: boolean;
  id: string;
  message?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [linkingAddress, setLinkingAddress] = useState<string | null>(null);

  // Delete wallet state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWalletId, setDeleteWalletId] = useState<string | null>(null);
  const [deleteWalletAddress, setDeleteWalletAddress] = useState("");

  // ─── Privy: connected wallets (wallets user gave permission to) ────────
  const { wallets: privyWallets } = useWallets();

  // ─── Privy: connect wallet (opens modal — MetaMask, WalletConnect etc.)
  const { connectWallet } = useConnectWallet({
    onSuccess: () => {
      toast.success("Wallet connected! You can now link it to your account.");
    },
    onError: () => {
      toast.error("Wallet connection was cancelled or failed");
    },
  });

  // ─── Fetch saved/linked wallets from DB ────────────────────────────────
  const walletsQuery = useQuery<WalletsApiResponse>({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await axios.get<WalletsApiResponse>("/api/wallets");
      return res.data;
    },
    enabled: !!session?.user?.id,
  });

  const savedWallets = walletsQuery.data?.data ?? [];
  const savedAddresses = new Set(
    savedWallets.map((w) => w.address.toLowerCase())
  );

  // ─── Link wallet mutation (save to DB) ─────────────────────────────────
  const linkWalletMutation = useMutation({
    mutationFn: async (address: string) => {
      const res = await axios.post<SaveWalletResponse>("/api/wallets", {
        address,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.message === "Wallet already saved") {
        toast.info("This wallet is already linked");
      } else {
        toast.success("Wallet linked to your account!");
      }
      setLinkingAddress(null);
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: () => {
      toast.error("Failed to link wallet");
      setLinkingAddress(null);
    },
  });

  // ─── Delete wallet mutation ────────────────────────────────────────────
  const deleteWalletMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/wallets/${id}`);
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      toast.success("Wallet unlinked");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: () => {
      toast.error("Failed to unlink wallet");
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleLinkWallet = (address: string) => {
    setLinkingAddress(address);
    linkWalletMutation.mutate(address);
  };

  const isAddressLinked = (address: string) =>
    savedAddresses.has(address.toLowerCase());

  const getLinkedWalletId = (address: string) => {
    const found = savedWallets.find(
      (w) => w.address.toLowerCase() === address.toLowerCase()
    );
    return found?.id ?? null;
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const openDeleteWallet = (address: string) => {
    const walletId = getLinkedWalletId(address);
    if (walletId) {
      setDeleteWalletId(walletId);
      setDeleteWalletAddress(address);
      setDeleteOpen(true);
    }
  };

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="text-xl font-bold text-foreground hover:text-primary transition-colors"
              >
                Better Auth
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session && (
                <>
                  <span className="text-sm text-muted-foreground">
                    Welcome, {session.user.name || session.user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="ml-4"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Signing out...
                      </>
                    ) : (
                      "Sign Out"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>

          {session && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* User Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Your basic account details and verification status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Name
                    </label>
                    <p className="text-muted-foreground">
                      {session.user.name || "Not provided"}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <p className="text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Email Verified
                    </label>
                    <p className="text-muted-foreground">
                      {session.user.emailVerified ? (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          ✗ Not verified
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>
                    Manage your account and session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Need to update your information? Contact support for
                      account changes.
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full">
                        Back to Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="w-full"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Signing out...
                        </>
                      ) : (
                        "Sign Out"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Card — spans full width */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Wallets
                      </CardTitle>
                      <CardDescription>
                        Connect your wallet to verify ownership, then link it to
                        your account.
                      </CardDescription>
                    </div>
                    <Button onClick={() => connectWallet()} size="sm">
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ── Connected wallets from Privy (available to link) ── */}
                  {privyWallets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">
                        Connected Wallets
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        These wallets are connected via your browser. Click
                        &quot;Link&quot; to save one to your account. To add
                        more wallets, click &quot;Connect Wallet&quot; again.
                      </p>
                      <div className="space-y-2">
                        {privyWallets.map((pw) => {
                          const linked = isAddressLinked(pw.address);
                          const isLinking = linkingAddress === pw.address;

                          return (
                            <div
                              key={pw.address}
                              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Ethereum
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {pw.walletClientType}
                                  </Badge>
                                </div>
                                <p className="font-mono text-sm text-foreground truncate">
                                  {pw.address}
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleCopyAddress(pw.address)
                                  }
                                >
                                  {copiedAddress === pw.address ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                {linked ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="text-green-600 border-green-600/30"
                                  >
                                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                    Linked
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleLinkWallet(pw.address)
                                    }
                                    disabled={isLinking}
                                  >
                                    {isLinking ? (
                                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                    ) : (
                                      <LinkIcon className="mr-1.5 h-4 w-4" />
                                    )}
                                    {isLinking ? "Linking..." : "Link"}
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    pw.disconnect();
                                    toast.info("Wallet disconnected");
                                  }}
                                  className="text-muted-foreground hover:text-destructive"
                                  title="Disconnect wallet"
                                >
                                  <Unplug className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Divider if both sections present ── */}
                  {privyWallets.length > 0 && savedWallets.length > 0 && (
                    <Separator />
                  )}

                  {/* ── Linked wallets (saved in DB) ── */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      Linked Wallets
                    </h3>
                    {walletsQuery.isLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : savedWallets.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Wallet className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">
                          No wallets linked yet. Connect a wallet above, then
                          click &quot;Link&quot; to save it.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {savedWallets.map((wallet) => (
                          <div
                            key={wallet.id}
                            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  Ethereum
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Verified
                                </Badge>
                              </div>
                              <p className="font-mono text-sm text-foreground truncate">
                                {wallet.address}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Linked{" "}
                                {new Date(
                                  wallet.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCopyAddress(wallet.address)
                                }
                              >
                                {copiedAddress === wallet.address ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openDeleteWallet(wallet.address)
                                }
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Empty state when no wallets connected at all ── */}
                  {privyWallets.length === 0 && savedWallets.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">
                        Click &quot;Connect Wallet&quot; to get started.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Delete Wallet Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink wallet{" "}
              <strong className="font-mono text-xs break-all">
                {deleteWalletAddress}
              </strong>
              ? You can always link it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteWalletId) deleteWalletMutation.mutate(deleteWalletId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWalletMutation.isPending ? "Unlinking..." : "Unlink"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfilePage;
