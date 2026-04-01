"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Loader2,
  Heart,
  ChevronRight,
  ExternalLink,
  Shield,
  Zap,
  Code2,
  Trash2,
  Pencil,
} from "lucide-react";
import { formatUnits } from "@/src/lib/utils/units";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const favorites = favoritesData?.data ?? [];
  const favoriteEndpoints =
    marketplaceData?.data?.filter((ep) => favorites.includes(ep.id)) ?? [];
  const myEndpoints = myEndpointsData?.data ?? [];

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    toast.loading("Signing out...", { id: "logout" });

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully", { id: "logout" });
          router.push("/signin");
          router.refresh();
        },
        onError: () => {
          setIsLoggingOut(false);
          toast.error("Failed to sign out", { id: "logout" });
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto py-10 px-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Welcome back,{" "}
              <span className="font-medium text-foreground">
                {session?.user.name}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/profile">
              <Button variant="outline" size="sm" className="rounded-lg">
                Profile Settings
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-lg"
              onClick={handleSignOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content — Favorites + My APIs */}
          <div className="lg:col-span-2 space-y-10">
            {/* Favorites */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  Saved APIs
                </h2>
                <Badge variant="secondary" className="rounded-md tabular-nums">
                  {favoriteEndpoints.length}
                </Badge>
              </div>

              {isLoadingFavorites || isLoadingMarketplace ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-muted/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : favoriteEndpoints.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Heart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold mb-1">
                      No saved APIs yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      Discover APIs in the marketplace and save them here.
                    </p>
                    <Link href="/marketplace">
                      <Button size="sm" className="rounded-lg">
                        Browse Marketplace
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {favoriteEndpoints.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                        {ep.imageUrl ? (
                          <img
                            src={ep.imageUrl}
                            alt={ep.description || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Code2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {ep.category && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 rounded"
                            >
                              {ep.category}
                            </Badge>
                          )}
                          {ep.chainName && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Shield className="h-2.5 w-2.5" />
                              {ep.chainName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {ep.description || "API Endpoint"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatUnits(ep.priceAmount, ep.tokenDecimals ?? 18)}{" "}
                          <span className="uppercase">{ep.tokenSymbol}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() =>
                            toggleFavoriteMutation.mutate(ep.id)
                          }
                          disabled={toggleFavoriteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/marketplace/${ep.id}`}>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-lg"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* My Registered APIs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  My Registered APIs
                </h2>
                <Badge variant="secondary" className="rounded-md tabular-nums">
                  {myEndpoints.length}
                </Badge>
              </div>

              {isLoadingMyEndpoints ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-muted/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : myEndpoints.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold mb-1">
                      No APIs registered yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      List your first API and start earning in USDC.
                    </p>
                    <Link href="/api-endpoints/create">
                      <Button size="sm" className="rounded-lg">
                        Register API
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {myEndpoints.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                        {ep.imageUrl ? (
                          <img
                            src={ep.imageUrl}
                            alt={ep.description || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Code2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {ep.category && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 rounded"
                            >
                              {ep.category}
                            </Badge>
                          )}
                          {ep.chainName && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Shield className="h-2.5 w-2.5" />
                              {ep.chainName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {ep.description || "API Endpoint"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={`/api-endpoints/${ep.id}/edit`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-xs gap-1.5"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/marketplace/${ep.id}`}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — Account Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-muted/50 px-3 py-2.5 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-medium truncate">
                    {session?.user.email}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2.5 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1.5">
                    Verification
                  </p>
                  {session?.user.emailVerified ? (
                    <Badge
                      variant="outline"
                      className="text-xs font-medium border-border"
                    >
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs font-medium">
                      Unverified
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <Zap className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold text-sm mb-1">
                  Build something new
                </h4>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Ready to list your own API and start earning in USDC?
                </p>
                <Link href="/api-endpoints/create">
                  <Button className="w-full rounded-lg" size="sm">
                    Register API
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
