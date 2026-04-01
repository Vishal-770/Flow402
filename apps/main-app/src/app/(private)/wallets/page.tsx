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
  Shield,
  Zap,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  Clock,
  ArrowRight,
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
import { cn } from "@/src/lib/utils";

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const displayedWallets = isExpanded 
    ? savedWallets 
    : savedWallets.slice(0, 5);

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
        toast.info("Identification Already Registered", {
          description: "This wallet signature is already associated with an account in our system.",
        });
      } else {
        toast.success("Identity Verified and Linked", {
          description: "New wallet successfully registered for platform activities.",
        });
      }
      setLinkingAddress(null);
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: () => {
      toast.error("Cryptographic Linkage Failed", {
        description: "An error occurred during verification. Please try again.",
      });
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
      toast.success("Identity Link Revoked", {
        description: "The address has been successfully removed from your account.",
      });
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: () => {
      toast.error("Revocation Failed");
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
      toast.success("Identification copied", { id: "copy-toast" });
      setTimeout(() => setCopiedAddress(null), 1500);
    } catch {
      toast.error("Failed to copy identification");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="pb-32 bg-background">
      <main className="max-w-[1400px] mx-auto py-16 px-8 lg:px-12">
        {/* Header Section: Flat & High Contrast */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16 border-b border-border/60 pb-12">
          <div className="space-y-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-primary/5 border border-primary/20 flex items-center justify-center rounded-2xl">
                 <Shield className="h-6 w-6 text-primary" />
               </div>
               <h1 className="text-5xl font-black tracking-tighter leading-none">Wallets</h1>
             </div>
             <p className="text-muted-foreground text-xl font-medium max-w-xl">
               Manage cryptographically verified identities and signatures for your Flow402 account.
             </p>
          </div>
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Total Identities</p>
              <p className="text-2xl font-black text-foreground tabular-nums">{savedWallets.length}</p>
            </div>
            <ConnectButton
                client={client}
                theme={"dark"}
                connectButton={{
                  label: "Connect Account",
                  className: "h-14 px-10 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl transition-all block text-base flex-1 lg:flex-none",
                }}
              />
          </div>
        </div>

        {/* Professional 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Main Area: Linked Wallets (Cols 1-7/8) */}
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-2">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-3">
                 <div className="w-8 h-px bg-border/60" /> Verified Signatures
               </h3>
            </div>

            {walletsQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/20 border border-border/40 animate-pulse" />)}
              </div>
            ) : savedWallets.length === 0 ? (
              <div className="rounded-[3rem] border border-dashed border-border/60 bg-muted/5 py-24 text-center transition-colors hover:bg-muted/10">
                <div className="w-16 h-16 rounded-3xl bg-muted/20 border border-border/40 flex items-center justify-center mx-auto mb-6">
                   <PlusCircle className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <h4 className="text-2xl font-black tracking-tight mb-2 opacity-80">Establish Linkage</h4>
                <p className="text-muted-foreground max-w-sm mx-auto font-bold opacity-60">
                  No cryptographic signatures detected. Connect a wallet to begin the verification process.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="group relative flex items-center gap-6 rounded-2xl border border-border/40 bg-card/10 p-5 hover:bg-muted/10 transition-colors backdrop-blur-sm overflow-hidden"
                  >
                    <div className="w-10 h-10 rounded-xl bg-background border border-border/60 flex items-center justify-center shrink-0">
                      <Wallet className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1 font-bold">
                        <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-muted/20 border-border/40 text-muted-foreground opacity-60 px-2 py-0 h-5">
                          EVM
                        </Badge>
                        <span className="flex items-center gap-1.5 text-[10px] text-green-500 uppercase font-black tracking-widest">
                          <CheckCircle2 className="h-3 w-3" /> VERIFIED
                        </span>
                      </div>
                      <p className="font-mono text-xs font-bold text-foreground truncate break-all tracking-tight tabular-nums opacity-90">
                        {wallet.address}
                      </p>
                      <div className="flex items-center gap-3 mt-1 opacity-20">
                         <Clock className="h-2.5 w-2.5" />
                         <p className="text-[9px] font-black uppercase tracking-widest">Linked on {new Date(wallet.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 relative z-10">
                       <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-background border border-transparent hover:border-border/60 transition-all"
                          onClick={() => handleCopyAddress(wallet.address)}
                        >
                          {copiedAddress === wallet.address ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground/20 group-hover:text-foreground/60" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl border border-transparent hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive group/del transition-all"
                          onClick={() => openDeleteWallet(wallet.address)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground/10 group-hover/del:text-destructive/60" />
                        </Button>
                    </div>
                  </div>
                ))}

                {savedWallets.length > 5 && (
                  <div className="pt-6">
                    <Button 
                      variant="ghost" 
                      className="w-full h-14 rounded-2xl border border-border/60 hover:bg-muted/10 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {isExpanded ? (
                        <>Contract View <ChevronRight className="h-4 w-4 rotate-[-90deg] transition-transform" /></>
                      ) : (
                        <>Expand All Identities <span className="opacity-30">({savedWallets.length - 5} More)</span> <ChevronRight className="h-4 w-4 rotate-90 transition-transform" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Area: Live Session Monitor (Cols 9-12) */}
          <div className="lg:col-span-4 space-y-10 sticky top-32 h-fit">
            
            <div className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-3">
                 <div className="w-8 h-px bg-border/60" /> Session Monitor
              </h3>
              
              <div className="rounded-[2.5rem] border border-border/60 bg-muted/5 p-10 relative overflow-hidden">
                {activeAccount ? (
                  <div className="space-y-8 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                      </div>
                      <span className="font-extrabold text-xl tracking-tight leading-none opacity-80 uppercase text-[15px] tracking-widest">Active Provider</span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">CURRENT SIGNATURE</p>
                      <div className="bg-background border border-border/60 rounded-2xl p-6 font-mono text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 break-all select-all">
                         {activeAccount.address}
                      </div>
                    </div>

                    <div className="pt-4">
                      {isAddressLinked(activeAccount.address) ? (
                        <div className="flex items-center justify-center gap-3 py-4 w-full rounded-2xl bg-green-500/10 text-green-500 font-black text-xs uppercase tracking-[0.2em] shadow-inner">
                           <CheckCircle2 className="h-4 w-4" /> LINK COMPLETE
                        </div>
                      ) : (
                        <Button
                          className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-primary/90 active:scale-[0.99] shadow-none"
                          onClick={() => handleLinkWallet(activeAccount.address)}
                          disabled={linkingAddress === activeAccount.address}
                        >
                          {linkingAddress === activeAccount.address ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-3" />
                          ) : (
                            <LinkIcon className="h-4 w-4 mr-3" />
                          )}
                          {linkingAddress === activeAccount.address ? "VERIFYING..." : "COMMIT IDENTITY"}
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-muted-foreground/40 text-center leading-relaxed font-bold uppercase tracking-widest italic pt-2">
                       A signature challenge may be required to finalize linkage.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-6 relative z-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-background border border-border/60 flex items-center justify-center mx-auto transition-colors hover:border-primary/20 hover:bg-muted/10">
                       <Zap className="h-10 w-10 text-muted-foreground/10" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="font-black text-lg uppercase tracking-widest opacity-30">Identity Inactive</h4>
                       <p className="text-[11px] text-muted-foreground/30 leading-relaxed font-bold uppercase tracking-widest">
                          Connect an external provider to monitor session status.
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Delete Wallet Dialog - Clinical & Precise */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-[3rem] border border-border/60 bg-background p-12 max-w-xl transition-all shadow-none backdrop-blur-none">
          <AlertDialogHeader className="space-y-6">
            <AlertDialogTitle className="text-4xl font-black tracking-tighter leading-none">Revoke<br/>Identity?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-muted-foreground/80 font-medium leading-normal">
              You are preparing to permanently revoke the cryptographic linkage for the following address:
              
              <div className="mt-8 mb-8 p-8 rounded-3xl bg-muted/10 border border-border/60 font-mono text-[11px] font-bold break-all text-foreground select-all opacity-80 leading-relaxed">
                 {deleteWalletAddress}
              </div>
              
              <span className="block font-black text-destructive/80 text-xs uppercase tracking-widest flex items-center gap-3">
                <Shield className="h-4 w-4" /> This will immediately suspend all platform permissions and API signatures.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-12 flex flex-col sm:flex-row gap-6">
            <AlertDialogCancel className="h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-border/60 bg-transparent flex-1 hover:bg-muted/10 transition-colors">CANCEL</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteWalletId) deleteWalletMutation.mutate(deleteWalletId);
              }}
              className="h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1 shadow-none"
            >
              {deleteWalletMutation.isPending ? (
                <Loader2 className="animate-spin h-4 w-4 mr-3" />
              ) : (
                <Trash2 className="h-4 w-4 mr-3" />
              )}
              {deleteWalletMutation.isPending ? "REVOKING ACCESS..." : "CONFIRM REVOCATION"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WalletsPage;
