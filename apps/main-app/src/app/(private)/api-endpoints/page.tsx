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
import { Separator } from "@/src/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  BarChart3,
  Code2,
} from "lucide-react";
import { formatUnits } from "@/src/lib/utils/units";

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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePath, setDeletePath] = useState("");

  const endpointsQuery = useQuery<{ success: boolean; data: ApiEndpointRow[] }>(
    {
      queryKey: ["api-endpoints"],
      queryFn: async () => {
        const res = await axios.get("/api/api-endpoints");
        return res.data;
      },
    }
  );

  const endpointsList = endpointsQuery.data?.data ?? [];

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
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
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

  const openDelete = (endpoint: ApiEndpointRow) => {
    setDeleteId(endpoint.id);
    setDeletePath(endpoint.gatewayPath);
    setDeleteOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">
              My API Listings
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage and monitor your endpoints registered on the marketplace.
          </p>
        </div>
        <Link href="/api-endpoints/create">
          <Button size="sm" className="rounded-lg gap-1.5">
            <Plus className="h-4 w-4" />
            Register API
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              All Endpoints
              <Badge variant="secondary" className="rounded-md tabular-nums text-xs">
                {endpointsList.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {endpointsQuery.isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : endpointsList.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Code2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">No endpoints yet</p>
              <p className="text-sm text-muted-foreground mb-5">
                Register your first API to get started.
              </p>
              <Link href="/api-endpoints/create">
                <Button size="sm" className="rounded-lg">
                  Register API
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Gateway Path</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Wallet
                    </TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpointsList.map((ep) => (
                    <TableRow key={ep.id}>
                      <TableCell className="pl-5">
                        <div>
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
                            {ep.gatewayPath}
                          </span>
                          {ep.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">
                              {ep.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {ep.category ? (
                          <Badge variant="secondary" className="rounded text-xs">
                            {ep.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-mono font-medium">
                            {formatUnits(ep.priceAmount, ep.tokenDecimals ?? 18)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1 uppercase">
                            {ep.tokenSymbol ?? ""}
                          </span>
                        </div>
                        {ep.chainName && (
                          <span className="text-xs text-muted-foreground">
                            {ep.chainName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {ep.walletAddress ? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {ep.walletAddress.slice(0, 6)}…
                            {ep.walletAddress.slice(-4)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
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
                      <TableCell className="text-right pr-5">
                        <div className="flex justify-end gap-1.5">
                          {ep.docsUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                              asChild
                            >
                              <a
                                href={ep.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                            asChild
                          >
                            <Link href={`/api-endpoints/${ep.id}/analytics`}>
                              <BarChart3 className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                            asChild
                          >
                            <Link href={`/api-endpoints/${ep.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openDelete(ep)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded border border-border">
                {deletePath}
              </code>
              ? This action cannot be undone.
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
