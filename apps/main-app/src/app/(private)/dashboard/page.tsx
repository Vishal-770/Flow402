"use client";

import React from "react";
import Link from "next/link";
import { authClient } from "@/src/lib/auth-client";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Heart,
  Shield,
  Zap,
  Code2,
  Trash2,
  ExternalLink,
  Pencil,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { formatUnits } from "@/src/lib/utils/units";
import Loader from "@/src/components/Loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";


interface MarketplaceEndpoint {
  id: string;
  description: string | null;
  imageUrl: string | null;
  priceAmount: string;
  tokenSymbol: string | null;
  tokenDecimals: number | null;
  chainName: string | null;
  category: string | null;
}

const DashboardPage = () => {
  const { data: session, isPending } = authClient.useSession();
  const queryClient = useQueryClient();

  const { data: favoritesData, isLoading: isLoadingFavorites } = useQuery<{
    success: boolean;
    data: string[];
  }>({
    queryKey: ["user-favorites"],
    queryFn: async () => {
      const res = await axios.get("/api/marketplace/favorites");
      return res.data;
    },
    enabled: !!session,
  });

  const { data: marketplaceData, isLoading: isLoadingMarketplace } = useQuery<{
    success: boolean;
    data: MarketplaceEndpoint[];
  }>({
    queryKey: ["marketplace"],
    queryFn: async () => {
      const res = await axios.get("/api/marketplace");
      return res.data;
    },
    enabled: !!session,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (apiEndpointId: string) => {
      const res = await axios.post("/api/marketplace/favorites", {
        apiEndpointId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      toast.success("Removed from favorites");
    },
  });

  const { data: myEndpointsData, isLoading: isLoadingMyEndpoints } = useQuery<{
    success: boolean;
    data: MarketplaceEndpoint[];
  }>({
    queryKey: ["my-endpoints"],
    queryFn: async () => {
      const res = await axios.get("/api/api-endpoints");
      return res.data;
    },
    enabled: !!session,
  });

  const deleteEndpointMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/api-endpoints/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-endpoints"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success("API Endpoint deleted successfully");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message =
        axiosError.response?.data?.message || "Failed to delete API endpoint";
      toast.error(message);
    },
  });

  const favorites = favoritesData?.data ?? [];
  const favoriteEndpoints =
    marketplaceData?.data?.filter((ep) => favorites.includes(ep.id)) ?? [];
  const myEndpoints = myEndpointsData?.data ?? [];

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pb-32">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-32">
      <main className="max-w-7xl mx-auto pt-16 pb-24 px-4 md:px-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground font-medium">
              Welcome back, <span className="text-foreground font-bold">{session?.user.name || session?.user.email}</span>. Manage your infrastructure and saved assets.
            </p>
          </div>
        </div>

        <div className="space-y-20">
          {/* Main content — Favorites + My APIs */}
          <div className="space-y-20">
            {/* Favorites */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  Saved Endpoints
                </h2>
                <Badge variant="secondary" className="rounded-md tabular-nums px-2.5 py-0.5 font-bold bg-muted/50 border border-border">
                  {favoriteEndpoints.length}
                </Badge>
              </div>

              {isLoadingFavorites || isLoadingMarketplace ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : favoriteEndpoints.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl flex flex-col items-center bg-muted/5">
                  <Heart className="h-10 w-10 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    No saved APIs
                  </h3>
                  <p className="text-sm text-muted-foreground mb-8 max-w-sm font-medium">
                    Explore the marketplace to find high-performance API endpoints to track and use in your projects.
                  </p>
                  <Link href="/marketplace">
                    <Button className="rounded-xl px-8 font-bold border-none">
                      Go to Marketplace
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="">
                  <div className="flex flex-col">
                    {favoriteEndpoints.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-6 py-6 border-b border-border last:border-0 group hover:bg-muted/10 transition-colors -mx-4 px-4 rounded-xl"
                      >
                        <div className="w-14 h-14 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                          {ep.imageUrl ? (
                            <Image
                              src={ep.imageUrl}
                              alt={ep.description || ""}
                              width={56}
                              height={56}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <Code2 className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-base font-bold truncate text-foreground">
                              {ep.description || "API Endpoint"}
                            </span>
                            {ep.chainName && (
                              <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20 bg-primary/5 uppercase tracking-wider">
                                {ep.chainName}
                              </Badge>
                            )}
                            {ep.category && (
                              <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border bg-muted/30 uppercase tracking-wider">
                                {ep.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                            Price: <span className="text-foreground">{formatUnits(ep.priceAmount, ep.tokenDecimals ?? 18)}</span>{" "}
                            <span className="text-foreground">{ep.tokenSymbol}</span> per call
                          </p>
                        </div>
                        <div className="flex items-center gap-3 sm:shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            onClick={() =>
                              toggleFavoriteMutation.mutate(ep.id)
                            }
                            disabled={toggleFavoriteMutation.isPending}
                            title="Remove from Saved"
                          >
                            {toggleFavoriteMutation.isPending && toggleFavoriteMutation.variables === ep.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                            )}
                          </Button>
                          <Link href={`/marketplace/${ep.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 rounded-xl text-xs font-bold px-5 border-border hover:bg-background transition-all"
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-border" />

            {/* My Registered APIs */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                  <Code2 className="h-5 w-5 text-primary" />
                  My API Infrastructure
                </h2>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="rounded-md tabular-nums px-2.5 py-0.5 font-bold bg-muted/50 border border-border">
                    {myEndpoints.length}
                  </Badge>
                  <Link href="/api-endpoints/create">
                    <Button size="sm" className="rounded-xl font-bold h-9 px-5 bg-primary text-primary-foreground text-xs shadow-sm">
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Register API
                    </Button>
                  </Link>
                </div>
              </div>

              {isLoadingMyEndpoints ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : myEndpoints.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl flex flex-col items-center bg-muted/5">
                  <Zap className="h-10 w-10 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    No infrastructure registered
                  </h3>
                  <p className="text-sm text-muted-foreground mb-8 max-w-sm font-medium">
                    List your first infrastructure endpoint to start generating tokenized revenue from the global developer network.
                  </p>
                  <Link href="/api-endpoints/create">
                    <Button className="rounded-xl px-8 font-bold border-none">
                      Launch First API
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="">
                  <div className="flex flex-col">
                    {myEndpoints.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-6 py-6 border-b border-border last:border-0 group hover:bg-muted/10 transition-colors -mx-4 px-4 rounded-xl"
                      >
                        <div className="w-14 h-14 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                          {ep.imageUrl ? (
                            <Image
                              src={ep.imageUrl}
                              alt={ep.description || ""}
                              width={56}
                              height={56}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <Code2 className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold truncate text-foreground">
                              {ep.description || "API Endpoint"}
                            </span>
                            {ep.chainName && (
                              <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20 bg-primary/5 uppercase tracking-wider">
                                {ep.chainName}
                              </Badge>
                            )}
                            {ep.category && (
                              <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border bg-muted/30 uppercase tracking-wider">
                                {ep.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                          <Link href={`/api-endpoints/${ep.id}/edit`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background border-none transition-all"
                              title="Edit Asset"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                                disabled={deleteEndpointMutation.isPending}
                                title="Delete Listing"
                              >
                                {deleteEndpointMutation.isPending && deleteEndpointMutation.variables === ep.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-border bg-background">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-extrabold tracking-tight">Delete Infrastructure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground font-medium">
                                  This will permanently remove <strong>{ep.description}</strong> from the marketplace and stop all incoming traffic. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-border font-bold">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteEndpointMutation.mutate(ep.id)}
                                  className="rounded-xl bg-red-500 text-white hover:bg-red-600 border-none font-bold"
                                >
                                  Confirm Deletion
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <Link href={`/marketplace/${ep.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 rounded-xl text-xs font-bold px-5 border-border hover:bg-background transition-all gap-1.5"
                            >
                              Details
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
