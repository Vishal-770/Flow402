"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {useTheme} from "next-themes"
import { authClient } from "@/src/lib/auth-client";
import { ConnectButton, useActiveAccount ,  darkTheme, lightTheme} from "thirdweb/react";
import { client } from "@/src/components/thirdweb-provider";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "sonner";
import {
  Wallet,
  Copy,
  Check,
  Loader2,
  Trash2,
  CheckCircle2,
  Zap,
  ChevronRight,
  PlusCircle,
  Clock,
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
import { Badge } from "@/src/components/ui/badge";

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

  const activeAccount = useActiveAccount();

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
    const {  theme  }= useTheme();
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

  // ─── Loading State ────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 space-y-12">
        <div className="flex items-start justify-between pb-12 border-b border-border">
          <div className="space-y-4 pt-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-10">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-10">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[300px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-background min-h-screen pb-32 pt-16">
      <main className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header Section: Professional & High Contrast */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16 border-b border-border pb-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
              Wallet Security
            </h1>
            <p className="text-muted-foreground font-medium max-w-2xl">
              Manage cryptographically verified identities and signatures. These signatures are used to prove ownership and authorize marketplace transactions.
            </p>
          </div>
          <div className="flex items-center gap-8 w-full lg:w-auto">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Links</p>
              <div className="flex items-center gap-2">
                 <Badge variant="secondary" className="text-lg px-3 py-0.5 rounded-md font-bold tabular-nums bg-muted/50 border border-border">
                    {savedWallets.length}
                 </Badge>
              </div>
            </div>
            <ConnectButton
                client={client}
                theme={theme === "light" ? lightTheme() : darkTheme()}
                connectButton={{
                  label: "Connect New Provider",
                  className: "h-12 px-8 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all w-full lg:w-auto text-sm shadow-sm",
                }}
              />
          </div>
        </div>

        {/* Professional 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Area: Linked Wallets (Cols 1-8) */}
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-2">
               <h2 className="text-2xl font-bold text-foreground">Verified Signatures</h2>
               <p className="text-sm text-muted-foreground font-medium">Platform-authorized cryptographic keys bound to your infrastructure profile.</p>
            </div>

            {walletsQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
              </div>
            ) : savedWallets.length === 0 ? (
              <div className="border border-border bg-muted/5 py-24 text-center rounded-2xl border-dashed">
                <div className="w-16 h-16 bg-background border border-border flex items-center justify-center mx-auto mb-6 rounded-2xl shadow-sm">
                   <PlusCircle className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-2">No active identities</h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed font-medium">
                  Begin by connecting a cryptographic provider to verify your first on-chain identity.
                </p>
              </div>
            ) : (
              <div className="flex flex-col border border-border rounded-2xl overflow-hidden bg-background shadow-sm">
                {displayedWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="group flex flex-col sm:flex-row items-center justify-between gap-6 p-6 border-b border-border last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-6 min-w-0">
                      <div className="w-12 h-12 bg-muted/30 border border-border flex items-center justify-center shrink-0 rounded-xl transition-transform group-hover:scale-105 shadow-sm">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20 tracking-widest uppercase">EVM</span>
                          <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10 tracking-widest uppercase">
                            <CheckCircle2 className="h-3 w-3" /> Linked
                          </span>
                        </div>
                        <p className="font-mono text-sm text-foreground font-medium truncate max-w-xs sm:max-w-md">
                          {wallet.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto items-center justify-end sm:pl-4">
                       <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mr-4 flex items-center gap-1.5">
                         <Clock className="w-3.5 h-3.5" />
                         {new Date(wallet.createdAt).toLocaleDateString()}
                       </span>
                       <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-background border-none transition-all rounded-xl"
                          onClick={() => handleCopyAddress(wallet.address)}
                        >
                          {copiedAddress === wallet.address ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 border-none transition-all rounded-xl"
                          onClick={() => openDeleteWallet(wallet.address)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                ))}

                {savedWallets.length > 5 && (
                  <div className="p-4 bg-muted/20">
                    <Button 
                      variant="ghost" 
                      className="w-full h-12 hover:bg-background transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {isExpanded ? (
                        <>Contract History <ChevronRight className="h-4 w-4 rotate-[-90deg]" /></>
                      ) : (
                        <>Expand Full Registry <span className="text-muted-foreground">({savedWallets.length - 5})</span> <ChevronRight className="h-4 w-4 rotate-90" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Area: Live Session Monitor (Cols 9-12) */}
          <div className="lg:col-span-4 space-y-10 sticky top-8 h-fit">
            <div className="space-y-6">
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-foreground">Active Session</h2>
                 <p className="text-sm text-muted-foreground font-medium">Real-time signal monitoring</p>
              </div>
              
              <div className="border border-border bg-background p-8 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-ping" />
                </div>

                {activeAccount ? (
                  <div className="space-y-8 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-widest text-emerald-600">Provider Live</span>
                    </div>
                    
                    <div className="space-y-3">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Address</p>
                      <div className="bg-muted/30 border border-border rounded-xl p-4 font-mono text-xs text-foreground break-all font-medium select-all">
                         {activeAccount.address}
                      </div>
                    </div>

                    <div className="pt-2">
                      {isAddressLinked(activeAccount.address) ? (
                        <div className="flex items-center justify-center gap-2 py-3 px-4 w-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 font-bold text-xs uppercase tracking-widest rounded-xl">
                           <CheckCircle2 className="h-4 w-4" /> Identity Verified
                        </div>
                      ) : (
                        <Button
                          className="w-full h-12 text-xs font-bold uppercase tracking-widest transition-all rounded-xl shadow-sm"
                          onClick={() => handleLinkWallet(activeAccount.address)}
                          disabled={linkingAddress === activeAccount.address}
                        >
                          {linkingAddress === activeAccount.address ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <PlusCircle className="h-4 w-4 mr-2" />
                          )}
                          {linkingAddress === activeAccount.address ? "Processing..." : "Commit Key"}
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center leading-relaxed">
                       Platform authorization requires <br /> a secure signature link.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-6 relative z-10">
                    <div className="w-16 h-16 bg-muted/30 border border-border flex items-center justify-center mx-auto rounded-2xl shadow-inner">
                       <Zap className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="font-bold text-sm text-foreground uppercase tracking-widest">Provider Idle</h4>
                       <p className="text-xs text-muted-foreground max-w-[180px] mx-auto leading-relaxed font-medium">
                          Connect a provider to initialize secure session management.
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Wallet Dialog - Frameless Modal Pattern */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border border-border bg-background p-10 max-w-xl shadow-2xl rounded-[2rem]">
          <AlertDialogHeader className="space-y-6">
            <AlertDialogTitle className="text-3xl font-extrabold tracking-tight text-foreground">Revoke Identity?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground font-medium leading-relaxed">
              You are about to permanently revoke the cryptographic linkage for the following address. This will immediately suspend all associated platform permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-6 my-8">
            <div className="p-5 rounded-2xl bg-muted/30 border border-border font-mono text-sm text-foreground break-all select-all font-bold tracking-tight">
               {deleteWalletAddress}
            </div>
          </div>

          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="h-12 text-xs font-bold uppercase tracking-widest border-border bg-transparent flex-1 hover:bg-muted/50 rounded-xl m-0">Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteWalletId) deleteWalletMutation.mutate(deleteWalletId);
              }}
              className="h-12 text-xs font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 flex-1 rounded-xl border-none shadow-sm"
            >
              {deleteWalletMutation.isPending ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {deleteWalletMutation.isPending ? "Processing..." : "Confirm Revocation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WalletsPage;
