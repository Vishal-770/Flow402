"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Pencil, Trash2, Plus, Loader2, ArrowLeft } from "lucide-react";

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

  return (
    <div className="container mx-auto py-10 max-w-5xl px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Tokens</h1>
          <p className="text-muted-foreground mt-1">Manage your tokens across chains</p>
        </div>
        <Link href="/tokens/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Token
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            All Tokens
            <Badge variant="secondary">{tokensList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tokensQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tokensList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tokens found. Add your first token to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="hidden sm:table-cell">Name</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead className="hidden md:table-cell">Contract</TableHead>
                    <TableHead className="hidden lg:table-cell">Decimals</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokensList.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {token.imageUri && (
                            <img
                              src={token.imageUri}
                              alt={token.symbol}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium">{token.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {token.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {token.chainName || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono text-xs truncate max-w-[120px] block">
                          {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {token.decimals}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(token)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDelete(token)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Token</DialogTitle>
            <DialogDescription>Update the token details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-token-symbol">Symbol</Label>
              <Input
                id="edit-token-symbol"
                value={editForm.symbol}
                onChange={(e) => setEditForm((prev) => ({ ...prev, symbol: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-token-name">Name</Label>
              <Input
                id="edit-token-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-token-chain">Chain</Label>
              <Select
                value={editForm.chainId}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, chainId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a chain" />
                </SelectTrigger>
                <SelectContent>
                  {chainsList.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name} (ID: {chain.chainId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-token-contract">Contract Address</Label>
              <Input
                id="edit-token-contract"
                value={editForm.contractAddress}
                onChange={(e) => setEditForm((prev) => ({ ...prev, contractAddress: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-token-decimals">Decimals</Label>
              <Input
                id="edit-token-decimals"
                type="number"
                value={editForm.decimals}
                onChange={(e) => setEditForm((prev) => ({ ...prev, decimals: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-token-explorer">Explorer Token URL</Label>
              <Input
                id="edit-token-explorer"
                value={editForm.explorerTokenUrl}
                onChange={(e) => setEditForm((prev) => ({ ...prev, explorerTokenUrl: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editId) updateMutation.mutate({ id: editId, data: editForm });
              }}
              disabled={updateMutation.isPending}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Token</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteSymbol}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
