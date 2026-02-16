"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
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
import { Switch } from "@/src/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { EditApiEndpointDialog } from "@/src/components/api-endpoints/edit-dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiEndpointRow {
  id: string;
  description: string | null;
  docsUrl: string | null;
  imageUrl: string | null;
  sampleResponse: string | null;
  walletId: string;
  priceAmount: string;
  tokenId: string;
  providerUrl: string;
  gatewayPath: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tokenSymbol: string | null;
  tokenDecimals: number | null;
  chainName: string | null;
  walletAddress: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ApiEndpointsPage() {
  const queryClient = useQueryClient();

  const [editId, setEditId] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePath, setDeletePath] = useState("");

  // ─── Data queries ──────────────────────────────────────────────────────

  const endpointsQuery = useQuery<{ success: boolean; data: ApiEndpointRow[] }>({
    queryKey: ["api-endpoints"],
    queryFn: async () => {
      const res = await axios.get("/api/api-endpoints");
      return res.data;
    },
  });

  const endpointsList = endpointsQuery.data?.data ?? [];

  // ─── Mutations ─────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/api-endpoints/${id}`);
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      toast.success("API endpoint deleted");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["api-endpoints"] });
    },
    onError: () => {
      toast.error("Failed to delete API endpoint");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await axios.put(`/api/api-endpoints/${id}`, { isActive });
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["api-endpoints"] });
    },
    onError: () => {
      toast.error("Failed to toggle status");
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────

  const openDelete = (endpoint: ApiEndpointRow) => {
    setDeleteId(endpoint.id);
    setDeletePath(endpoint.gatewayPath);
    setDeleteOpen(true);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto py-10 max-w-6xl px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">My API Endpoints</h1>
          <p className="text-muted-foreground mt-1">
            Manage your registered APIs on the marketplace
          </p>
        </div>
        <Link href="/api-endpoints/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Register API
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            All Endpoints
            <Badge variant="secondary">{endpointsList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {endpointsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : endpointsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No API endpoints registered yet. Register your first API to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gateway Path</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">Wallet</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpointsList.map((ep) => (
                    <TableRow key={ep.id}>
                      <TableCell>
                        <div>
                          <span className="font-mono text-sm">{ep.gatewayPath}</span>
                          {ep.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {ep.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {ep.category ? (
                          <Badge variant="secondary">{ep.category}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-mono">{ep.priceAmount}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {ep.tokenSymbol ?? ""}
                          </span>
                        </div>
                        {ep.chainName && (
                          <span className="text-xs text-muted-foreground">
                            on {ep.chainName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {ep.walletAddress ? (
                          <span className="font-mono text-xs">
                            {ep.walletAddress.slice(0, 6)}...
                            {ep.walletAddress.slice(-4)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={ep.isActive}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({
                              id: ep.id,
                              isActive: checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {ep.docsUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={ep.docsUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditId(ep.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDelete(ep)}
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

      <EditApiEndpointDialog 
        id={editId} 
        open={!!editId} 
        onOpenChange={(open) => !open && setEditId(null)} 
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="font-mono">{deletePath}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
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
