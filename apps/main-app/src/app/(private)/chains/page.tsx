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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Pencil, Trash2, Plus, Loader2, ArrowLeft, Network } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChainRow {
  id: string;
  name: string;
  chainId: number;
  imageUri: string | null;
  explorerBaseUrl: string;
  createdAt: string;
}

interface ChainsApiResponse {
  success: boolean;
  data: ChainRow[];
}

interface EditChainState {
  name: string;
  chainId: number;
  explorerBaseUrl: string;
  imageUri: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChainsPage() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditChainState>({
    name: "",
    chainId: 0,
    explorerBaseUrl: "",
    imageUri: "",
  });

  const [isUploading, setIsUploading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<EditChainState>({
    name: "",
    chainId: 0,
    explorerBaseUrl: "",
    imageUri: "",
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const chainsQuery = useQuery<ChainsApiResponse>({
    queryKey: ["chains"],
    queryFn: async () => {
      const res = await axios.get<ChainsApiResponse>("/api/chains");
      return res.data;
    },
  });

  const chains = chainsQuery.data?.data ?? [];

  const originalChain = chains.find(c => c.id === editId);
  const isEditDirty = originalChain
    ? editForm.name !== originalChain.name ||
      editForm.chainId !== originalChain.chainId ||
      editForm.explorerBaseUrl !== originalChain.explorerBaseUrl
    : false;

  const createMutation = useMutation({
    mutationFn: async (data: EditChainState) => {
      const res = await axios.post(`/api/chains`, data);
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      toast.success("Network added successfully");
      setCreateOpen(false);
      setCreateForm({ name: "", chainId: 0, explorerBaseUrl: "", imageUri: "" });
      queryClient.invalidateQueries({ queryKey: ["chains"] });
    },
    onError: () => {
      toast.error("Failed to add network");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditChainState }) => {
      const res = await axios.put(`/api/chains/${id}`, data);
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      toast.success("Chain updated successfully");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["chains"] });
    },
    onError: () => {
      toast.error("Failed to update chain");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/chains/${id}`);
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      toast.success("Chain deleted successfully");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["chains"] });
    },
    onError: () => {
      toast.error("Failed to delete chain");
    },
  });

  const openEdit = (chain: ChainRow) => {
    setEditId(chain.id);
    setEditForm({
      name: chain.name,
      chainId: chain.chainId,
      explorerBaseUrl: chain.explorerBaseUrl,
      imageUri: chain.imageUri ?? "",
    });
    setEditOpen(true);
  };

  const openDelete = (chain: ChainRow) => {
    setDeleteId(chain.id);
    setDeleteName(chain.name);
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
                <Network className="h-6 w-6 text-foreground" />
                Network Chains
              </h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-xl lg:pl-11">
              Manage and configure supported blockchain networks for the platform.
            </p>
          </div>
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Supported</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{chains.length}</p>
            </div>
            {isAdmin && (
              <Button 
                onClick={() => setCreateOpen(true)}
                className="h-10 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors w-full lg:w-auto text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Network
              </Button>
            )}
          </div>
        </div>

        {/* Flat Content List */}
        <div className="space-y-4">
          {chainsQuery.isLoading ? (
            <div className="flex justify-center py-20 border border-border border-dashed rounded-lg bg-secondary/10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chains.length === 0 ? (
            <div className="border border-border bg-secondary/20 py-16 text-center rounded-lg">
              <div className="w-12 h-12 bg-secondary border border-border flex items-center justify-center mx-auto mb-4 rounded-md">
                 <Network className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-semibold tracking-tight text-foreground mb-1">No Networks Found</h4>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Add your first blockchain network to get started.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-secondary/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground">Network Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Chain ID</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-foreground">Explorer Link</TableHead>
                    {isAdmin && <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chains.map((chain) => (
                    <TableRow key={chain.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {chain.imageUri ? (
                            <Image
                              src={chain.imageUri}
                              alt={chain.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-md object-contain bg-background border border-border"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center">
                              <Network className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-semibold text-sm">{chain.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs font-semibold bg-secondary/50">
                          {chain.chainId}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <a
                          href={chain.explorerBaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate max-w-[250px] block transition-colors"
                        >
                          {chain.explorerBaseUrl}
                        </a>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary text-muted-foreground hover:text-foreground" onClick={() => openEdit(chain)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={() => openDelete(chain)}
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
          )}
        </div>
      </main>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border border-border bg-background p-8 max-w-md shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-foreground">Add Network</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Register a new blockchain connection parameter.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-chain-name" className="text-xs font-semibold text-muted-foreground uppercase">Network Name</Label>
              <Input
                id="create-chain-name"
                className="bg-secondary/20 focus-visible:ring-1 border-border"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ethereum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-chain-id" className="text-xs font-semibold text-muted-foreground uppercase">Chain ID</Label>
              <Input
                id="create-chain-id"
                type="number"
                className="bg-secondary/20 focus-visible:ring-1 border-border font-mono"
                value={createForm.chainId || ""}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, chainId: Number(e.target.value) }))}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-chain-explorer" className="text-xs font-semibold text-muted-foreground uppercase">Explorer Base URL</Label>
              <Input
                id="create-chain-explorer"
                className="bg-secondary/20 focus-visible:ring-1 border-border text-xs"
                value={createForm.explorerBaseUrl}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, explorerBaseUrl: e.target.value }))}
                placeholder="https://etherscan.io"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Network Icon (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadIcon(e, false)}
                  disabled={isUploading}
                  className="bg-secondary/20 focus-visible:ring-1 border-border flex-1"
                />
                {createForm.imageUri && (
                  <div className="w-10 h-10 rounded-md border border-border shrink-0 overflow-hidden bg-secondary">
                    <Image src={createForm.imageUri} alt="Preview" width={40} height={40} className="w-full h-full object-contain" />
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
              disabled={createMutation.isPending || isUploading || !createForm.name || !createForm.chainId}
            >
              {createMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
              ) : "Add Network"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border border-border bg-background p-8 max-w-md shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-foreground">Edit Network</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Modify the blockchain connection parameters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-chain-name" className="text-xs font-semibold text-muted-foreground uppercase">Network Name</Label>
              <Input
                id="edit-chain-name"
                className="bg-secondary/20 focus-visible:ring-1 border-border"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-chain-id" className="text-xs font-semibold text-muted-foreground uppercase">Chain ID</Label>
              <Input
                id="edit-chain-id"
                type="number"
                className="bg-secondary/20 focus-visible:ring-1 border-border font-mono"
                value={editForm.chainId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, chainId: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-chain-explorer" className="text-xs font-semibold text-muted-foreground uppercase">Explorer Base URL</Label>
              <Input
                id="edit-chain-explorer"
                className="bg-secondary/20 focus-visible:ring-1 border-border text-xs"
                value={editForm.explorerBaseUrl}
                onChange={(e) => setEditForm((prev) => ({ ...prev, explorerBaseUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Network Icon (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadIcon(e, true)}
                  disabled={isUploading}
                  className="bg-secondary/20 focus-visible:ring-1 border-border flex-1"
                />
                {editForm.imageUri && (
                  <div className="w-10 h-10 rounded-md border border-border shrink-0 overflow-hidden bg-secondary">
                    <Image src={editForm.imageUri} alt="Preview" width={40} height={40} className="w-full h-full object-contain" />
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
            <AlertDialogTitle className="text-xl font-bold text-foreground">Remove Network?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to completely remove the <span className="font-semibold text-foreground">{deleteName}</span> network? This action could break tokens associated with this chain.
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
