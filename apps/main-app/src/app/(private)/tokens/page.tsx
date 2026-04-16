"use client";

import React, { useState } from "react";
import { useIsAdmin } from "@/src/lib/use-is-admin";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { uploadImage } from "@/src/lib/upload";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Pencil, Trash2, Plus, Loader2, ArrowLeft, Coins } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChainRow {
  id: string;
  name: string;
  chainId: number;
  imageUri: string | null;
}

interface ChainsApiResponse {
  success: boolean;
  data: ChainRow[];
}

interface TokenRow {
  id: string;
  symbol: string;
  name: string | null;
  imageUri: string | null;
  chainId: string;
  contractAddress: string;
  decimals: number;
  explorerTokenUrl: string | null;
  createdAt: string;
  chainName: string | null;
}

interface TokensApiResponse {
  success: boolean;
  data: TokenRow[];
}

interface EditTokenState {
  symbol: string;
  name: string;
  chainId: string;
  contractAddress: string;
  decimals: number;
  explorerTokenUrl: string;
  imageUri: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TokensPage() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditTokenState>({
    symbol: "",
    name: "",
    chainId: "",
    contractAddress: "",
    decimals: 18,
    explorerTokenUrl: "",
    imageUri: "",
  });

  const [isUploading, setIsUploading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<EditTokenState>({
    symbol: "",
    name: "",
    chainId: "",
    contractAddress: "",
    decimals: 18,
    explorerTokenUrl: "",
    imageUri: "",
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSymbol, setDeleteSymbol] = useState("");

  const chainsQuery = useQuery<ChainsApiResponse>({
    queryKey: ["chains"],
    queryFn: async () => {
      const res = await axios.get<ChainsApiResponse>("/api/chains");
      return res.data;
    },
  });

  const tokensQuery = useQuery<TokensApiResponse>({
    queryKey: ["tokens"],
    queryFn: async () => {
      const res = await axios.get<TokensApiResponse>("/api/tokens");
      return res.data;
    },
  });

  const chainsList = chainsQuery.data?.data ?? [];
  const tokensList = tokensQuery.data?.data ?? [];

  const originalToken = tokensList.find(t => t.id === editId);
  const isEditDirty = originalToken
    ? editForm.symbol !== originalToken.symbol ||
      editForm.name !== (originalToken.name ?? "") ||
      editForm.chainId !== originalToken.chainId ||
      editForm.contractAddress !== originalToken.contractAddress ||
      editForm.decimals !== originalToken.decimals ||
      editForm.explorerTokenUrl !== (originalToken.explorerTokenUrl ?? "")
    : false;

  const createMutation = useMutation({
    mutationFn: async (data: EditTokenState) => {
      const res = await axios.post(`/api/tokens`, data);
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      toast.success("Asset registered successfully");
      setCreateOpen(false);
      setCreateForm({ symbol: "", name: "", chainId: "", contractAddress: "", decimals: 18, explorerTokenUrl: "", imageUri: "" });
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
    },
    onError: () => {
      toast.error("Failed to register asset");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditTokenState }) => {
      const res = await axios.put(`/api/tokens/${id}`, data);
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      toast.success("Token updated successfully");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
    },
    onError: () => {
      toast.error("Failed to update token");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/tokens/${id}`);
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      toast.success("Token deleted successfully");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
    },
    onError: () => {
      toast.error("Failed to delete token");
    },
  });

  const openEdit = (token: TokenRow) => {
    setEditId(token.id);
    setEditForm({
      symbol: token.symbol,
      name: token.name ?? "",
      chainId: token.chainId,
      contractAddress: token.contractAddress,
      decimals: token.decimals,
      explorerTokenUrl: token.explorerTokenUrl ?? "",
      imageUri: token.imageUri ?? "",
    });
    setEditOpen(true);
  };

  const openDelete = (token: TokenRow) => {
    setDeleteId(token.id);
    setDeleteSymbol(token.symbol);
    setDeleteOpen(true);
  };

  const uploadIcon = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await uploadImage(file);
      if (isEdit) {
        setEditForm(prev => ({ ...prev, imageUri: url }));
      } else {
        setCreateForm(prev => ({ ...prev, imageUri: url }));
      }
      toast.success("Icon uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload icon");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-background pb-32">
      <main className="max-w-6xl mx-auto py-10 px-6 mt-4">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 border-b border-border pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="hidden lg:block text-muted-foreground hover:text-foreground transition-colors mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Coins className="h-6 w-6 text-foreground" />
                Asset Registry
              </h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-xl lg:pl-11">
              Manage acceptable tokens and pricing assets across all platform networks.
            </p>
          </div>
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Tokens</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{tokensList.length}</p>
            </div>
            {isAdmin && (
              <Button 
                onClick={() => setCreateOpen(true)}
                className="h-10 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors w-full lg:w-auto text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Token
              </Button>
            )}
          </div>
        </div>

        {/* Flat Content List */}
        <div className="space-y-4">
          {tokensQuery.isLoading ? (
            <div className="flex justify-center py-20 border border-border border-dashed rounded-lg bg-secondary/10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tokensList.length === 0 ? (
            <div className="border border-border bg-secondary/20 py-16 text-center rounded-lg">
              <div className="w-12 h-12 bg-secondary border border-border flex items-center justify-center mx-auto mb-4 rounded-md">
                 <Coins className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-semibold tracking-tight text-foreground mb-1">No Assets Active</h4>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                No tokens available. Register your first asset to enable marketplace transactions.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-foreground">Asset</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold text-foreground">Name</TableHead>
                      <TableHead className="font-semibold text-foreground">Network</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-foreground">Contract Address</TableHead>
                      <TableHead className="hidden lg:table-cell font-semibold text-foreground">Decimals</TableHead>
                      {isAdmin && <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokensList.map((token) => (
                      <TableRow key={token.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {token.imageUri ? (
                            <Image
                                src={token.imageUri}
                                alt={token.symbol}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-contain bg-background border border-border"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center">
                                <Coins className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-semibold text-sm">{token.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {token.name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold bg-secondary/50 text-xs">
                            {token.chainName || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block">
                            {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                           <Badge variant="outline" className="bg-background text-muted-foreground font-mono">
                              {token.decimals}
                           </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary text-muted-foreground hover:text-foreground" onClick={() => openEdit(token)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                onClick={() => openDelete(token)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border border-border bg-background p-8 max-w-md shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-foreground">Register Asset</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Define a new ERC20 token for the marketplace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-token-symbol" className="text-xs font-semibold text-muted-foreground uppercase">Token Symbol</Label>
              <Input
                id="create-token-symbol"
                className="bg-secondary/20 focus-visible:ring-1 border-border font-semibold uppercase"
                value={createForm.symbol}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                placeholder="ETH"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-token-name" className="text-xs font-semibold text-muted-foreground uppercase">Token Name</Label>
              <Input
                id="create-token-name"
                className="bg-secondary/20 focus-visible:ring-1 border-border"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ethereum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-token-chain" className="text-xs font-semibold text-muted-foreground uppercase">Host Network</Label>
              <Select
                value={createForm.chainId}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, chainId: value }))}
              >
                <SelectTrigger className="bg-secondary/20 focus-visible:ring-1 border-border">
                  <SelectValue placeholder="Select a network" />
                </SelectTrigger>
                <SelectContent>
                  {chainsList.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-token-contract" className="text-xs font-semibold text-muted-foreground uppercase">Contract Address</Label>
              <Input
                id="create-token-contract"
                className="bg-secondary/20 focus-visible:ring-1 border-border font-mono text-xs"
                value={createForm.contractAddress}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, contractAddress: e.target.value }))}
                placeholder="0x..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-token-decimals" className="text-xs font-semibold text-muted-foreground uppercase">Decimals</Label>
                <Input
                  id="create-token-decimals"
                  type="number"
                  className="bg-secondary/20 focus-visible:ring-1 border-border font-mono"
                  value={createForm.decimals}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, decimals: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-token-explorer" className="text-xs font-semibold text-muted-foreground uppercase">Block Explorer</Label>
                <Input
                  id="create-token-explorer"
                  className="bg-secondary/20 focus-visible:ring-1 border-border text-xs"
                  value={createForm.explorerTokenUrl}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, explorerTokenUrl: e.target.value }))}
                  placeholder="https://"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Token Icon (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadIcon(e, false)}
                  disabled={isUploading}
                  className="bg-secondary/20 focus-visible:ring-1 border-border flex-1"
                />
                {createForm.imageUri && (
                  <div className="w-10 h-10 rounded-full border border-border shrink-0 overflow-hidden bg-secondary flex items-center justify-center">
                    <Image src={createForm.imageUri} alt="Preview" width={24} height={24} className="w-6 h-6 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="h-10 text-sm font-semibold border-border hover:bg-secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              className="h-10 text-sm font-semibold"
              onClick={() => createMutation.mutate(createForm)}
              disabled={createMutation.isPending || isUploading || !createForm.symbol || !createForm.chainId || !createForm.contractAddress}
            >
              {createMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering...</>
              ) : "Register Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border border-border bg-background p-8 max-w-md shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-foreground">Update Token</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Modify the smart contract parameters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-token-symbol" className="text-xs font-semibold text-muted-foreground uppercase">Token Symbol</Label>
              <Input
                id="edit-token-symbol"
                className="bg-secondary/20 focus-visible:ring-1 border-border font-semibold uppercase"
                value={editForm.symbol}
                onChange={(e) => setEditForm((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-token-name" className="text-xs font-semibold text-muted-foreground uppercase">Token Name</Label>
              <Input
                id="edit-token-name"
                className="bg-secondary/20 focus-visible:ring-1 border-border"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-token-chain" className="text-xs font-semibold text-muted-foreground uppercase">Host Network</Label>
              <Select
                value={editForm.chainId}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, chainId: value }))}
              >
                <SelectTrigger className="bg-secondary/20 focus-visible:ring-1 border-border">
                  <SelectValue placeholder="Select a network" />
                </SelectTrigger>
                <SelectContent>
                  {chainsList.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-token-contract" className="text-xs font-semibold text-muted-foreground uppercase">Contract Address</Label>
              <Input
                id="edit-token-contract"
                className="bg-secondary/20 focus-visible:ring-1 border-border font-mono text-xs"
                value={editForm.contractAddress}
                onChange={(e) => setEditForm((prev) => ({ ...prev, contractAddress: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-token-decimals" className="text-xs font-semibold text-muted-foreground uppercase">Decimals</Label>
                <Input
                  id="edit-token-decimals"
                  type="number"
                  className="bg-secondary/20 focus-visible:ring-1 border-border font-mono"
                  value={editForm.decimals}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, decimals: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-token-explorer" className="text-xs font-semibold text-muted-foreground uppercase">Block Explorer</Label>
                <Input
                  id="edit-token-explorer"
                  className="bg-secondary/20 focus-visible:ring-1 border-border text-xs"
                  value={editForm.explorerTokenUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, explorerTokenUrl: e.target.value }))}
                  placeholder="https://"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Token Icon (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadIcon(e, true)}
                  disabled={isUploading}
                  className="bg-secondary/20 focus-visible:ring-1 border-border flex-1"
                />
                {editForm.imageUri && (
                  <div className="w-10 h-10 rounded-full border border-border shrink-0 overflow-hidden bg-secondary flex items-center justify-center">
                    <Image src={editForm.imageUri} alt="Preview" width={24} height={24} className="w-6 h-6 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="h-10 text-sm font-semibold border-border hover:bg-secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              className="h-10 text-sm font-semibold"
              onClick={() => {
                if (editId) updateMutation.mutate({ id: editId, data: editForm });
              }}
              disabled={updateMutation.isPending || !isEditDirty}
            >
              {updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border border-border bg-background p-8 max-w-md shadow-lg">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-bold text-foreground">Remove Asset?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to completely deregister <span className="font-semibold text-foreground uppercase">{deleteSymbol}</span>? Prices and marketplace entries tied to this token will be invalidated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
            <AlertDialogCancel className="h-10 text-sm font-semibold border border-border bg-transparent hover:bg-secondary m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
              className="h-10 text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 m-0"
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              {deleteMutation.isPending ? "Removing..." : "Confirm Removal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
