"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Loader2,
  Globe,
  Coins,
  Shield,
  Zap
} from "lucide-react";
import { formatUnits } from "@/src/lib/utils/units";
import Link from "next/link";

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const marketplaceQuery = useQuery<{ success: boolean; data: MarketplaceEndpoint[] }>({
    queryKey: ["marketplace"],
    queryFn: async () => {
      const res = await axios.get("/api/marketplace");
      return res.data;
    },
  });

  const allEndpoints = marketplaceQuery.data?.data ?? [];

  const filteredEndpoints = allEndpoints.filter((ep) => {
    const matchesSearch = 
      (ep.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (ep.category?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (ep.tokenSymbol?.toLowerCase() || "").includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || ep.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-muted/30 pt-16 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-[radial-gradient(circle_at_30%_20%,var(--color-primary)_0%,transparent_25%)] opacity-10" />
        
        <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                Explore the <span className="text-primary">API Marketplace</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                Discover and integrate decentralized APIs with crypto-native payments. 
                High-performance gateways, zero-friction integration.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative group animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                    type="text"
                    placeholder="Search by description, category, or token..."
                    className="pl-12 py-6 text-lg rounded-2xl shadow-xl border-border/50 bg-background/50 backdrop-blur-sm focus-visible:ring-primary/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 space-y-8 animate-in fade-in slide-in-from-left duration-500">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" /> Categories
              </h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === cat 
                        ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20" 
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> List your API
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                    Got a service? Monetize it instantly on Flow402.
                </p>
                <Link href="/api-endpoints/create">
                    <Button size="sm" className="w-full rounded-xl">Register API</Button>
                </Link>
            </div>
          </aside>

          {/* Grid */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">
                    {filteredEndpoints.length} APIs found
                </h2>
                {marketplaceQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {marketplaceQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-80 rounded-3xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : filteredEndpoints.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-[2rem] border border-dashed">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No APIs found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEndpoints.map((ep) => (
                        <ApiCard key={ep.id} ep={ep} />
                    ))}
                </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ApiCard({ ep }: { ep: MarketplaceEndpoint }) {
    return (
        <Card className="group overflow-hidden rounded-[2rem] border-border/50 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 bg-card hover:-translate-y-1">
            <CardHeader className="p-0 relative h-40 overflow-hidden bg-muted/20">
                {ep.imageUrl ? (
                    <img 
                        src={ep.imageUrl} 
                        alt={ep.category || "API"} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-blue-500/10">
                        <Code2 className="h-12 w-12 text-primary/20" />
                    </div>
                )}
                {ep.category && (
                    <Badge className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm text-foreground border-none shadow-lg">
                        {ep.category}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-muted border border-border overflow-hidden">
                        {ep.providerImage ? (
                            <img src={ep.providerImage} alt={ep.providerName || ""} />
                        ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {ep.providerName?.[0] || 'P'}
                            </div>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px]">
                        {ep.providerName || "Anonymous Provider"}
                    </span>
                </div>
                <CardTitle className="text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {ep.description || "Unnamed API"}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                    {ep.description || "No description provided for this high-performance API endpoint."}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Price</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-foreground">
                                {formatUnits(ep.priceAmount, ep.tokenDecimals ?? 18)}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground uppercase">{ep.tokenSymbol}</span>
                        </div>
                    </div>
                    {ep.chainName && (
                        <div className="text-right">
                             <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Network</span>
                             <div className="text-xs font-medium flex items-center gap-1 justify-end">
                                 <Shield className="h-3 w-3 text-primary" />
                                 {ep.chainName}
                             </div>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
                <Button className="w-full rounded-xl group/btn" asChild>
                    <Link href={`/marketplace/${ep.id}`}>
                        View Details
                        <ChevronRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

const Code2 = ({ className }: { className?: string }) => (
    <svg 
        className={className}
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
)
