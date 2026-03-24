"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
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
  Trash2
} from "lucide-react";
import { formatUnits } from "@/src/lib/utils/units";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";

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

  // Fetch Favorites IDs
  const { data: favoritesData, isLoading: isLoadingFavorites } = useQuery<{ success: boolean; data: string[] }>({
    queryKey: ["user-favorites"],
    queryFn: async () => {
      const res = await axios.get("/api/marketplace/favorites");
      return res.data;
    },
    enabled: !!session,
  });

  // Fetch All Marketplace Endpoints to get details for favorites
  const { data: marketplaceData, isLoading: isLoadingMarketplace } = useQuery<{ success: boolean; data: MarketplaceEndpoint[] }>({
    queryKey: ["marketplace"],
    queryFn: async () => {
      const res = await axios.get("/api/marketplace");
      return res.data;
    },
    enabled: !!session,
  });

  // Toggle Favorite Mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (apiEndpointId: string) => {
      const res = await axios.post("/api/marketplace/favorites", { apiEndpointId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      toast.success("Removed from favorites");
    },
  });

  const favorites = favoritesData?.data ?? [];
  const favoriteEndpoints = marketplaceData?.data?.filter(ep => favorites.includes(ep.id)) ?? [];

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back, {session?.user.name}!</p>
          </div>
          <div className="flex gap-4">
            <Link href="/profile">
              <Button variant="outline" className="rounded-xl px-6">Profile Settings</Button>
            </Link>
            <Button
              variant="destructive"
              className="rounded-xl px-6"
              onClick={handleSignOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Favorites Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500 fill-current" /> My Favorites
              </h2>
              <Badge variant="secondary" className="rounded-lg">{favoriteEndpoints.length}</Badge>
            </div>

            {isLoadingFavorites || isLoadingMarketplace ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />)}
              </div>
            ) : favoriteEndpoints.length === 0 ? (
              <Card className="rounded-[2rem] border-dashed p-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-6">Discover APIs in the marketplace and save them here for quick access.</p>
                <Link href="/marketplace">
                  <Button className="rounded-xl px-8 shadow-lg shadow-primary/20">
                    Browse Marketplace
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-4">
                {favoriteEndpoints.map((ep) => (
                  <Card key={ep.id} className="rounded-3xl border-border/50 group overflow-hidden bg-card/50 backdrop-blur-sm">
                    <div className="flex items-center p-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        {ep.imageUrl ? (
                          <img src={ep.imageUrl} alt={ep.description || ""} className="w-full h-full object-cover" />
                        ) : (
                          <Code2 className="h-8 w-8 text-primary/40" />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter px-2 py-0">
                            {ep.category}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                            <Shield className="h-2.5 w-2.5" /> {ep.chainName}
                          </span>
                        </div>
                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                          {ep.description || "API Endpoint"}
                        </h4>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-sm font-black">{formatUnits(ep.priceAmount, ep.tokenDecimals ?? 18)}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{ep.tokenSymbol}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => toggleFavoriteMutation.mutate(ep.id)}
                          disabled={toggleFavoriteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Link href={`/marketplace/${ep.id}`}>
                          <Button size="icon" variant="outline" className="rounded-xl">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats / Account Info */}
          <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-border/50 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-xl">Account overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-background rounded-2xl p-4 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Email</p>
                  <p className="font-bold truncate">{session?.user.email}</p>
                </div>
                <div className="bg-background rounded-2xl p-4 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Verification</p>
                  <div className="flex items-center gap-2">
                    {session?.user.emailVerified ? (
                      <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20">Verified</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/10 border-red-500/20">Unverified</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-[2.5rem] border-primary/20 bg-primary/5 overflow-hidden">
                <CardContent className="p-6">
                    <Zap className="h-10 w-10 text-primary mb-4" />
                    <h4 className="font-black text-lg mb-2">Build something new</h4>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Ready to list your own API and start earning in USDC?</p>
                    <Link href="/api-endpoints/create">
                        <Button className="w-full rounded-xl">Register API</Button>
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
