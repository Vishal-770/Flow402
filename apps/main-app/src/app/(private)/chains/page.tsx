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

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditChainState>({
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
          <h1 className="text-3xl font-bold text-foreground">Chains</h1>
          <p className="text-muted-foreground mt-1">Manage your blockchain networks</p>
        </div>
        <Link href="/chains/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Chain
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            All Chains
            <Badge variant="secondary">{chains.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chainsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No chains found. Add your first chain to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Chain ID</TableHead>
                  <TableHead className="hidden md:table-cell">Explorer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chains.map((chain) => (
                  <TableRow key={chain.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {chain.imageUri && (
                          <img
                            src={chain.imageUri}
                            alt={chain.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">{chain.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{chain.chainId}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <a
                        href={chain.explorerBaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate max-w-[200px] block"
                      >
                        {chain.explorerBaseUrl}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(chain)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDelete(chain)}
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
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chain</DialogTitle>
            <DialogDescription>Update the chain details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-chain-name">Name</Label>
              <Input
                id="edit-chain-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-chain-id">Chain ID</Label>
              <Input
                id="edit-chain-id"
                type="number"
                value={editForm.chainId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, chainId: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-chain-explorer">Explorer Base URL</Label>
              <Input
                id="edit-chain-explorer"
                value={editForm.explorerBaseUrl}
                onChange={(e) => setEditForm((prev) => ({ ...prev, explorerBaseUrl: e.target.value }))}
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
            <AlertDialogTitle>Delete Chain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteName}</strong>? This action cannot be undone.
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
