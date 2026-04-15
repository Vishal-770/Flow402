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
    <div className="max-w-7xl mx-auto pt-12 pb-24 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">My Endpoints</h1>
          <p className="text-muted-foreground font-medium">
            Manage your registered API listings and control access in real-time.
          </p>
        </div>
        <Link href="/api-endpoints/create">
          <Button className="rounded-xl px-6 font-bold shadow-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Register New API
          </Button>
        </Link>
      </div>

      <div className="border border-border bg-background rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Registered Listings
              <Badge variant="secondary" className="rounded-md tabular-nums px-2 py-0.5 bg-background border border-border text-[10px] font-bold">
                {endpointsList.length}
              </Badge>
            </h2>
          </div>
        </div>

        {endpointsQuery.isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : endpointsList.length === 0 ? (
          <div className="text-center py-24 px-6">
            <Code2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-1">No endpoints registered</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
              Ready to monetize your high-availability APIs? Start by registering your first endpoint.
            </p>
            <Link href="/api-endpoints/create">
              <Button variant="outline" className="rounded-xl px-8">
                Get Started
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="pl-6 py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Gateway Path</TableHead>
                  <TableHead className="hidden sm:table-cell py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Category
                  </TableHead>
                  <TableHead className="py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Pricing</TableHead>
                  <TableHead className="hidden md:table-cell py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Payout Wallet
                  </TableHead>
                  <TableHead className="py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-right pr-6 py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpointsList.map((ep) => (
                  <TableRow key={ep.id} className="group hover:bg-muted/30 border-border transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs text-primary font-bold">
                          /{ep.gatewayPath}
                        </span>
                        {ep.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px] font-medium">
                            {ep.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-4">
                      {ep.category ? (
                        <Badge variant="outline" className="rounded-lg text-[10px] font-bold bg-secondary/30 border-border px-2">
                          {ep.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <div className="text-xs font-bold">
                          {formatUnits(ep.priceAmount, ep.tokenDecimals ?? 18)}
                          <span className="ml-1 uppercase text-[10px] text-muted-foreground">{ep.tokenSymbol ?? ""}</span>
                        </div>
                        {ep.chainName && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {ep.chainName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-4">
                      {ep.walletAddress ? (
                        <span className="font-mono text-[10px] text-muted-foreground font-medium uppercase bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                          {ep.walletAddress.slice(0, 6)}…
                          {ep.walletAddress.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={ep.isActive}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({
                              id: ep.id,
                              isActive: checked,
                            })
                          }
                          className="scale-90"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background border-none transition-all"
                          asChild
                          title="View Analytics"
                        >
                          <Link href={`/api-endpoints/${ep.id}/analytics`}>
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background border-none transition-all"
                          asChild
                          title="Edit Details"
                        >
                          <Link href={`/api-endpoints/${ep.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-none transition-all"
                          onClick={() => openDelete(ep)}
                          title="Delete Endpoint"
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
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold tracking-tight">Revoke API Listing?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              You are about to permanently delete the listing for{" "}
              <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border font-bold text-primary">
                /{deletePath}
              </code>
              . This will immediately stop all billing and marketplace traffic. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-border font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
              className="bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold border-none"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm Deletion"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
