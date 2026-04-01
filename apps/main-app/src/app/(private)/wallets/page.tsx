"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { authClient } from "@/src/lib/auth-client";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/src/components/thirdweb-provider";
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

const WalletsPage = () => {
  const { data: session, isPending } = authClient.useSession();
  const queryClient = useQueryClient();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [linkingAddress, setLinkingAddress] = useState<string | null>(null);

  // Delete wallet state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWalletId, setDeleteWalletId] = useState<string | null>(null);
  const [deleteWalletAddress, setDeleteWalletAddress] = useState("");

  // ─── Thirdweb: active account ──────────────────────────────────────────
  const activeAccount = useActiveAccount();

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

  // ─── Loading ────────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading wallets...</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-0">
            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Wallets</h1>
            <p className="text-muted-foreground">
              Connect and link your digital wallets to your account.
            </p>
          </div>

          <div className="grid gap-6 mt-8">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Saved Wallets
                    </CardTitle>
                    <CardDescription>
                      Manage your linked addresses and verify ownership.
                    </CardDescription>
                  </div>
                  <ConnectButton
                    client={client}
                    theme={"dark"}
                    connectButton={{
                      label: "Connect Wallet",
                      className: "h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-sm",
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Active wallet from Thirdweb (available to link) ── */}
                {activeAccount && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Active Connection
                    </h3>
                    <div className="space-y-2">
                      {(() => {
                        const linked = isAddressLinked(activeAccount.address);
                        const isLinking = linkingAddress === activeAccount.address;

                        return (
                          <div
                            key={activeAccount.address}
                            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4 transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-bold uppercase tracking-wider h-5 bg-background border-border/50"
                                >
                                  Ethereum
                                </Badge>
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5 bg-background text-primary border-primary/20">
                                  Current
                                </Badge>
                              </div>
                              <p className="font-mono text-xs font-medium text-foreground truncate opacity-80">
                                {activeAccount.address}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-lg border-border/50"
                                onClick={() =>
                                  handleCopyAddress(activeAccount.address)
                                }
                              >
                                {copiedAddress === activeAccount.address ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              {linked ? (
                                <div className="flex items-center px-4 py-1.5 rounded-lg border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-bold">
                                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                  Linked
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="h-9 px-4 rounded-lg font-bold"
                                  onClick={() =>
                                    handleLinkWallet(activeAccount.address)
                                  }
                                  disabled={isLinking}
                                >
                                  {isLinking ? (
                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-primary-foreground" />
                                  ) : (
                                    <LinkIcon className="mr-1.5 h-4 w-4" />
                                  )}
                                  {isLinking ? "Linking..." : "Link Wallet"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── Divider if both sections present ── */}
                {activeAccount && savedWallets.length > 0 && (
                  <Separator className="opacity-50" />
                )}

                {/* ── Linked wallets (saved in DB) ── */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
                    Linked Accounts
                  </h3>
                  {walletsQuery.isLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                    </div>
                  ) : savedWallets.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl border border-dashed border-border bg-muted/10 transition-colors hover:bg-muted/20">
                      <Wallet className="h-10 w-10 mx-auto mb-3 opacity-10" />
                      <p className="text-sm font-medium text-muted-foreground/80">
                        No wallets linked to your account.
                      </p>
                      <p className="text-xs text-muted-foreground/40 mt-1">
                        Connect a wallet above to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedWallets.map((wallet) => (
                        <div
                          key={wallet.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4 hover:bg-muted/50 transition-all shadow-sm group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-bold uppercase tracking-wider h-5 bg-background border-border/50"
                              >
                                Ethereum
                              </Badge>
                              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5 bg-background text-green-600 border-green-600/20">
                                Verified
                              </Badge>
                            </div>
                            <p className="font-mono text-xs font-medium text-foreground truncate">
                              {wallet.address}
                            </p>
                            <p className="text-[10px] font-semibold text-muted-foreground/40 mt-1 uppercase tracking-widest">
                              Linked on {new Date(wallet.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-lg border-border/50 hover:bg-background transition-colors"
                              onClick={() =>
                                handleCopyAddress(wallet.address)
                              }
                            >
                              {copiedAddress === wallet.address ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground/60" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-lg text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive border-border/50 transition-all opacity-40 group-hover:opacity-100"
                              onClick={() =>
                                openDeleteWallet(wallet.address)
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Empty state when no wallets connected at all ── */}
                {!activeAccount && savedWallets.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground/30 border-t border-border pt-8 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Session inactive — connect an address to link
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Wallet Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="tracking-tight">Unlink Wallet</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to unlink wallet{" "}
              <strong className="font-mono text-[11px] break-all text-foreground bg-muted p-1.5 rounded-lg block mt-2 border border-border/50">
                {deleteWalletAddress}
              </strong>
              <span className="block mt-4">You can always link it again later.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl font-semibold border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteWalletId) deleteWalletMutation.mutate(deleteWalletId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-semibold shadow-sm"
            >
              {deleteWalletMutation.isPending ? "Unlinking..." : "Unlink Wallet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WalletsPage;
