"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/src/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import {
  Search,
  Code2,
  Heart,
  X,
  SlidersHorizontal,
  ArrowRight,
  ShoppingBag,
  Check,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { formatUnits } from "@/src/lib/utils/units";
import Link from "next/link";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarketplaceEndpoint {
  id: string;
  description: string | null;
  docsUrl: string | null;
  imageUrl: string | null;
  sampleResponse: string | null;
  priceAmount: string;
  tokenId: string;
  category: string | null;
  tokenSymbol: string | null;
  tokenDecimals: number | null;
  chainName: string | null;
  providerName: string | null;
  providerImage: string | null;
  tags: string[];
}

const CATEGORIES = [
  "All",
  "AI & Machine Learning",
  "Finance & Banking",
  "Blockchain & Crypto",
  "Data & Analytics",
  "Communication",
  "Social Media",
  "Weather",
  "Maps & Location",
  "E-Commerce",
  "Healthcare",
  "Other",
];

type SortOption = "newest" | "price-asc" | "price-desc" | "popular";

// ─── Component ───────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const marketplaceQuery = useQuery<{
    success: boolean;
    data: MarketplaceEndpoint[];
  }>({
    queryKey: ["marketplace"],
    queryFn: async () => {
      const res = await axios.get("/api/marketplace");
      return res.data;
    },
  });

  const favoritesQuery = useQuery<{ success: boolean; data: string[] }>({
    queryKey: ["user-favorites"],
    queryFn: async () => {
      const res = await axios.get("/api/marketplace/favorites");
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      toast.success(
        data.action === "added" ? "Added to favorites" : "Removed from favorites"
      );
    },
    onError: () => {
      toast.error("Failed to update favorites");
    },
  });

  const allEndpoints = useMemo(() => marketplaceQuery.data?.data ?? [], [marketplaceQuery.data]);
  const favorites = favoritesQuery.data?.data ?? [];

  const processedEndpoints = useMemo(() => {
    const result = allEndpoints.filter((ep) => {
      const matchesSearch =
        (ep.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (ep.category?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (ep.tokenSymbol?.toLowerCase() || "").includes(search.toLowerCase()) ||
        ep.tags.some((tag) =>
          tag.toLowerCase().includes(search.toLowerCase())
        );
      const matchesCategory =
        selectedCategory === "All" || ep.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => Number(a.priceAmount) - Number(b.priceAmount));
        break;
      case "price-desc":
        result.sort((a, b) => Number(b.priceAmount) - Number(a.priceAmount));
        break;
      case "newest":
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
    }

    return result;
  }, [allEndpoints, search, selectedCategory, sortBy]);

  const popularTags = useMemo(() => {
    const tags = allEndpoints.flatMap((ep) => ep.tags);
    return Array.from(new Set(tags)).slice(0, 15);
  }, [allEndpoints]);

  return (
    <div className="bg-background min-h-screen pb-20">
      <main className="max-w-[1400px] mx-auto py-10 px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10 pb-8 border-b border-border">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-muted border border-border flex items-center justify-center rounded-lg">
                <ShoppingBag className="h-4 w-4 text-foreground" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              Discover & integrate high-performance decentralized APIs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search endpoints..."
                className="pl-9 h-10 rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              )}
            </div>

            {/* Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-4 rounded-lg font-medium gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {selectedCategory !== "All" && (
                    <Badge className="ml-1 h-4 px-1.5 text-[10px] rounded-sm">
                      1
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-sm p-0 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6">
                  <SheetHeader className="mb-6 text-left">
                    <SheetTitle className="text-xl font-bold">
                      Filters
                    </SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                      Refine results to find exactly what you need.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-8">
                    {/* Sort */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Sort By
                      </label>
                      <Select
                        value={sortBy}
                        onValueChange={(v) => setSortBy(v as SortOption)}
                      >
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="price-asc">
                            Price: Low to High
                          </SelectItem>
                          <SelectItem value="price-desc">
                            Price: High to Low
                          </SelectItem>
                          <SelectItem value="popular">
                            Most Popular
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Categories */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Category
                      </label>
                      <div className="space-y-1">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                              selectedCategory === cat
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-transparent border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border"
                            )}
                          >
                            {cat}
                            {selectedCategory === cat && (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Popular Tags */}
                    {popularTags.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Popular Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {popularTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setSearch(tag)}
                              className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                                search.toLowerCase() === tag.toLowerCase()
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                              )}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sheet Footer */}
                {(selectedCategory !== "All" || search) && (
                  <div className="p-4 border-t border-border">
                    <Button
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() => {
                        setSearch("");
                        setSelectedCategory("All");
                      }}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {marketplaceQuery.isLoading
              ? "Loading..."
              : `${processedEndpoints.length} listing${processedEndpoints.length !== 1 ? "s" : ""}`}
          </p>
          {(selectedCategory !== "All" || search) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Listing Grid */}
        {marketplaceQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-secondary/50 border border-border animate-pulse"
              />
            ))}
          </div>
        ) : processedEndpoints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-transparent py-24 text-center">
            <div className="w-14 h-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              No endpoints found
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
              Try adjusting your filters or search terms.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-background">
            <div className="divide-y divide-border">
              {processedEndpoints.map((ep) => (
                <ApiCard
                  key={ep.id}
                  ep={ep}
                  isFavorite={favorites.includes(ep.id)}
                  isToggling={toggleFavoriteMutation.isPending && toggleFavoriteMutation.variables === ep.id}
                  onToggleFavorite={() => {
                    if (!session) {
                      toast.error("Sign in to save favorites.");
                      return;
                    }
                    toggleFavoriteMutation.mutate(ep.id);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ApiCard({
  ep,
  isFavorite,
  isToggling,
  onToggleFavorite,
}: {
  ep: MarketplaceEndpoint;
  isFavorite: boolean;
  isToggling?: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <Link href={`/marketplace/${ep.id}`} className="block group w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-5 p-5 hover:bg-secondary/30 transition-colors bg-background">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden border border-border relative group-hover:border-primary/30 transition-colors">
          {ep.imageUrl ? (
            <Image
              src={ep.imageUrl}
              alt={ep.category || "API Endpoint"}
              width={64}
              height={64}
              className="w-full h-full object-contain p-2"
            />
          ) : (
             <Code2 className="h-6 w-6 text-muted-foreground opacity-50 relative z-10" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors max-w-full">
              {ep.description || "API Endpoint"}
            </span>
            {ep.chainName && (
               <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border bg-secondary/20 px-1.5 py-0 uppercase shrink-0">
                 {ep.chainName}
               </Badge>
            )}
            {ep.category && (
               <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border bg-secondary/20 px-1.5 py-0 shrink-0">
                 {ep.category}
               </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
             <div className="flex items-center gap-1.5 font-medium">
               <span className="font-bold text-foreground">
                 {formatUnits(ep.priceAmount, ep.tokenDecimals ?? 18)}
               </span>
               <span className="uppercase">{ep.tokenSymbol}</span> per call
             </div>
             
             {ep.providerName && (
               <>
                 <div className="w-1 h-1 rounded-full bg-border" />
                 <span className="truncate max-w-[120px] font-medium">{ep.providerName}</span>
               </>
             )}
          </div>

          {/* Tags */}
          {ep.tags && ep.tags.length > 0 && (
             <div className="flex items-center gap-1.5 mt-1 flex-wrap">
               {ep.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-[10px] font-mono text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded border border-border/50">
                    {tag.toLowerCase()}
                  </span>
               ))}
               {ep.tags.length > 4 && (
                  <span className="text-[10px] text-muted-foreground shrink-0">+{ep.tags.length - 4}</span>
               )}
             </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex sm:flex-row items-center gap-2 shrink-0 ml-auto w-full sm:w-auto mt-4 sm:mt-0 justify-end">
          <Button
             variant="ghost"
             size="icon"
             disabled={isToggling}
             className={cn("h-9 w-9 rounded-md transition-colors", isFavorite ? "text-primary hover:text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-foreground")}
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               onToggleFavorite();
             }}
          >
             {isToggling ? (
               <Loader2 className="h-4 w-4 animate-spin opacity-50" />
             ) : (
               <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
             )}
          </Button>
          <Button
             variant="secondary"
             size="sm"
             className="h-9 px-4 rounded-md text-xs font-semibold border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all w-full sm:w-auto mt-2 sm:mt-0"
          >
             View Details
             <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
