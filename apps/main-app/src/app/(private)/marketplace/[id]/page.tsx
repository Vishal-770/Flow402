"use client";

import React, { useState, useEffect } from "react";
import {
  useFetchWithPayment,
  ConnectButton,
  useActiveAccount,
} from "thirdweb/react";
import { client } from "@/src/components/thirdweb-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { formatUnits } from "@/src/lib/utils/units";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  ChevronLeft,
  Loader2,
  Globe,
  Code2,
  Zap,
  Shield,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Clock,
  Database,
  Star,
  MessageSquare,
  User as UserIcon,
  Heart,
  List,
  FileJson,
  Search,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string | null;
  reviewerImage: string | null;
}

interface ReviewStats {
  averageRating: number;
  totalCount: number;
}

interface RequestBodyField {
  fieldName: string;
  fieldType: string;
  required: boolean;
  description: string | null;
  exampleValue: string | null;
}

interface QueryParam {
  name: string;
  type: string;
  required: boolean;
  description: string | null;
  defaultValue: string | null;
}

interface UpstreamHeader {
  headerName: string;
  headerValue: string;
}

interface MarketplaceEndpointDetail {
  id: string;
  description: string | null;
  docsUrl: string | null;
  imageUrl: string | null;
  sampleResponse: string | null;
  priceAmount: string;
  tokenId: string;
  providerUrl: string | null;
  gatewayPath: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tokenSymbol: string | null;
  tokenDecimals: number | null;
  chainName: string | null;
  chainId: string | null;
  providerName: string | null;
  providerImage: string | null;
  upstreamHeaders?: UpstreamHeader[];
  queryParams?: QueryParam[];
  requestBody?: RequestBodyField[];
  tags: string[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EndpointDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<{
    status: string;
    message?: string;
  } | null>(null);

  const handlePing = async () => {
    setPingLoading(true);
    try {
      const res = await axios.get(`/api/marketplace/${id}/ping`);
      setPingResult(res.data);
      if (res.data.status === "active") {
        toast.success("API is responding and active");
      } else {
        toast.error(`API status issue: ${res.data.status}`);
      }
    } catch (err) {
      setPingResult({
        status: "error",
        message: "Failed to reach health service",
      });
      toast.error("Health check failed");
    } finally {
      setPingLoading(false);
    }
  };

  const detailQuery = useQuery<{
    success: boolean;
    data: MarketplaceEndpointDetail;
  }>({
    queryKey: ["marketplace-detail", id],
    queryFn: async () => {
      const res = await axios.get(`/api/marketplace/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const reviewsQuery = useQuery<{
    success: boolean;
    data: Review[];
    stats: ReviewStats;
  }>({
    queryKey: ["marketplace-reviews", id],
    queryFn: async () => {
      const res = await axios.get(`/api/marketplace/${id}/reviews`);
      return res.data;
    },
    enabled: !!id,
  });

  const reviewMutation = useMutation({
    mutationFn: async (newReview: { rating: number; comment: string }) => {
      const res = await axios.post(`/api/marketplace/${id}/reviews`, newReview);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Review submitted successfully");
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["marketplace-reviews", id] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to submit review";
      toast.error(message);
    },
  });

  const endpoint = detailQuery.data?.data;
  const reviews = reviewsQuery.data?.data ?? [];
  const stats = reviewsQuery.data?.stats;

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
        data.action === "added"
          ? "Added to favorites"
          : "Removed from favorites",
      );
    },
    onError: () => {
      toast.error("Failed to update favorites");
    },
  });

  const isFavorite = favoritesQuery.data?.data?.includes(id as string) ?? false;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in to post a review");
      return;
    }
    if (!comment.trim()) {
      toast.error("Comment is required");
      return;
    }
    reviewMutation.mutate({ rating, comment });
  };

  const handleToggleFavorite = () => {
    if (!session) {
      toast.error("Please sign in to favorite APIs");
      return;
    }
    toggleFavoriteMutation.mutate(id as string);
  };

  if (detailQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">
            Loading API details...
          </p>
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !endpoint) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 rounded-[2rem] border-dashed">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h2 className="text-2xl font-bold mb-2">API Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The endpoint you are looking for might have been de-listed or
            doesn't exist.
          </p>
          <Button
            onClick={() => router.push("/marketplace")}
            variant="outline"
            className="rounded-xl"
          >
            Back to Marketplace
          </Button>
        </Card>
      </div>
    );
  }

  const curlExample = `curl -X POST "https://gateway.flow402.com${endpoint.gatewayPath}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"query": "example"}'`;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative bg-muted/30 pt-12 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors group"
          >
            <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Marketplace
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
              {endpoint.imageUrl ? (
                <img
                  src={endpoint.imageUrl}
                  alt={endpoint.description || "API"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Code2 className="h-12 w-12 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge
                  variant="outline"
                  className="bg-background/50 backdrop-blur-sm border-primary/20 text-primary"
                >
                  {endpoint.category || "General"}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-background/50 backdrop-blur-sm"
                >
                  <Shield className="h-3 w-3 mr-1 text-primary" />
                  {endpoint.chainName}
                </Badge>
                <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold border border-yellow-400/20">
                  <Star className="h-3 w-3 fill-current" />
                  {stats?.averageRating.toFixed(1) || "0.0"} (
                  {stats?.totalCount || 0})
                </div>
                {endpoint.tags &&
                  endpoint.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-primary/5 text-primary/70 border-primary/20 text-[10px] uppercase font-black px-2 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-6 rounded-full bg-background/50 backdrop-blur-sm border-primary/20 text-[9px] font-black uppercase gap-1.5 hover:bg-primary/10 transition-all ${
                    pingResult?.status === "active"
                      ? "ring-2 ring-green-500/20"
                      : pingResult?.status === "inactive" ||
                          pingResult?.status === "error"
                        ? "ring-2 ring-red-500/20"
                        : ""
                  }`}
                  onClick={handlePing}
                  disabled={pingLoading}
                >
                  {pingLoading ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : pingResult?.status === "active" ? (
                    <Activity className="h-2.5 w-2.5 text-green-500" />
                  ) : pingResult?.status === "inactive" ||
                    pingResult?.status === "error" ? (
                    <Activity className="h-2.5 w-2.5 text-red-500" />
                  ) : (
                    <Activity className="h-2.5 w-2.5 text-primary" />
                  )}
                  {pingResult ? (
                    <span
                      className={
                        pingResult.status === "active"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      Health: {pingResult.status}
                    </span>
                  ) : (
                    "Check Status"
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  {endpoint.description || "Unnamed API Endpoint"}
                </h1>
                <button
                  onClick={handleToggleFavorite}
                  className={`p-3 rounded-2xl backdrop-blur-md border shadow-lg transition-all hover:scale-110 shrink-0 ${
                    isFavorite
                      ? "bg-red-500/10 border-red-500/20 text-red-500"
                      : "bg-background/50 border-border/50 text-muted-foreground hover:text-red-500"
                  }`}
                  title={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Heart
                    className={`h-6 w-6 ${isFavorite ? "fill-current" : ""}`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                    {endpoint.providerName?.[0] || "P"}
                  </div>
                  <span className="text-sm font-medium">
                    {endpoint.providerName || "Anonymous Provider"}
                  </span>
                </div>
                <span className="text-muted-foreground/30">•</span>
                <Link
                  href={endpoint.docsUrl || "#"}
                  target="_blank"
                  className="text-sm hover:text-primary flex items-center gap-1 transition-colors"
                >
                  Documentation <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-background/50 backdrop-blur-md border border-border/50 p-1 rounded-2xl h-14 mb-8">
                <TabsTrigger
                  value="overview"
                  className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="test"
                  className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Try it Out
                </TabsTrigger>
                <TabsTrigger
                  value="integration"
                  className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Integration
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Technical Specs
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
                >
                  Reviews{" "}
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 h-4 min-w-[16px] flex items-center justify-center"
                  >
                    {stats?.totalCount || 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="overview"
                className="space-y-8 mt-0 outline-none"
              >
                <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">API Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {endpoint.description ||
                        "This API provides a high-performance, decentralized gateway to various data sources and computational services with native Web3 payments."}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                        <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-primary" /> Instant
                          Integration
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Connect via our global edge gateway with minimal
                          latency.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                        <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-500" /> Secure
                          Payments
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Pay-per-use directly in {endpoint.tokenSymbol} on the{" "}
                          {endpoint.chainName} network.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sample Response */}
                {endpoint.sampleResponse && (
                  <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Database className="h-5 w-5 text-primary" /> Sample
                        Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="p-6 rounded-2xl bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto shadow-inner border border-zinc-800">
                        {endpoint.sampleResponse}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="test" className="mt-0 outline-none">
                <ApiTestPanel endpoint={endpoint} />
              </TabsContent>

              <TabsContent
                value="specs"
                className="space-y-8 mt-0 outline-none"
              >
                {/* Headers */}
                <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <List className="h-5 w-5 text-primary" /> Upstream Headers
                    </CardTitle>
                    <CardDescription>
                      These headers are sent by the gateway to the provider.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {endpoint.upstreamHeaders &&
                    endpoint.upstreamHeaders.length > 0 ? (
                      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-inner">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b border-border/50">
                            <tr>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Value
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {endpoint.upstreamHeaders.map((h, i) => (
                              <tr
                                key={i}
                                className="hover:bg-primary/5 transition-colors"
                              >
                                <td className="px-4 py-3 font-mono text-primary text-xs uppercase tracking-tight">
                                  {h.headerName}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px] font-medium">
                                  {h.headerValue}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl border border-dashed text-muted-foreground opacity-50 font-bold">
                        No upstream headers defined
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Query Params */}
                <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <Search className="h-5 w-5 text-primary" /> Query
                      Parameters
                    </CardTitle>
                    <CardDescription>
                      Supported dynamic parameters for this API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {endpoint.queryParams && endpoint.queryParams.length > 0 ? (
                      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-inner">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b border-border/50">
                            <tr>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Type
                              </th>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Required
                              </th>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Default
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {endpoint.queryParams.map((p, i) => (
                              <tr
                                key={i}
                                className="hover:bg-primary/5 transition-colors font-medium"
                              >
                                <td className="px-4 py-3 font-mono text-primary font-bold">
                                  {p.name}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-bold uppercase"
                                  >
                                    {p.type}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  {p.required ? (
                                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 uppercase text-[10px] font-black">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs font-bold uppercase opacity-50">
                                      No
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                                  {p.defaultValue || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl border border-dashed text-muted-foreground opacity-50 font-bold">
                        No query parameters defined
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Request Body */}
                <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <FileJson className="h-5 w-5 text-primary" /> Request Body
                      Fields
                    </CardTitle>
                    <CardDescription>
                      Fields that should be included in the JSON request body.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {endpoint.requestBody && endpoint.requestBody.length > 0 ? (
                      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-inner font-bold">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b border-border/50">
                            <tr>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Field
                              </th>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Type
                              </th>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Required
                              </th>
                              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-[10px]">
                                Example
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {endpoint.requestBody.map((b, i) => (
                              <tr
                                key={i}
                                className="hover:bg-primary/5 transition-colors font-medium"
                              >
                                <td className="px-4 py-3 font-mono text-primary font-bold">
                                  {b.fieldName}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-bold uppercase"
                                  >
                                    {b.fieldType}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  {b.required ? (
                                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 uppercase text-[10px] font-black">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs uppercase opacity-50 font-bold">
                                      No
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground truncate max-w-[150px]">
                                  {b.exampleValue || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl border border-dashed text-muted-foreground opacity-50 font-bold">
                        No request body fields defined
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integration" className="mt-0 outline-none">
                <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="h-6 w-6 text-primary" /> Integration
                      Guide
                    </CardTitle>
                    <CardDescription>
                      Use the following sample to integrate this API into your
                      application.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="curl" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 rounded-xl mb-4">
                        <TabsTrigger value="curl" className="rounded-lg">
                          cURL
                        </TabsTrigger>
                        <TabsTrigger value="js" className="rounded-lg">
                          JavaScript
                        </TabsTrigger>
                        <TabsTrigger value="python" className="rounded-lg">
                          Python
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl" className="relative group">
                        <pre className="p-6 rounded-2xl bg-muted font-mono text-sm overflow-x-auto border border-border/50">
                          {curlExample}
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(curlExample)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TabsContent>
                      <TabsContent value="js">
                        <pre className="p-6 rounded-2xl bg-muted font-mono text-sm overflow-x-auto border border-border/50 text-muted-foreground">
                           SDK Integration Guide coming soon...
                        </pre>
                      </TabsContent>
                      <TabsContent value="python">
                        <pre className="p-6 rounded-2xl bg-muted font-mono text-sm overflow-x-auto border border-border/50 text-muted-foreground">
                          # SDK Integration Guide coming soon...
                        </pre>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="reviews"
                className="mt-0 outline-none space-y-8"
              >
                {/* Review Form */}
                {session ? (
                  <Card className="rounded-[2.5rem] border-primary/20 bg-primary/5 overflow-hidden">
                    <form onSubmit={handleReviewSubmit}>
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-primary" />{" "}
                          Post a Review
                        </CardTitle>
                        <CardDescription>
                          Share your experience with this API with the
                          community.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Rating</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setRating(i)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`h-8 w-8 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Your Feedback</p>
                          <Textarea
                            placeholder="What was your experience using this API? Are the responses accurate and timely?"
                            className="rounded-2xl min-h-[120px] bg-background border-border/50 focus-visible:ring-primary/30"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-end">
                        <Button
                          type="submit"
                          className="rounded-xl px-8"
                          disabled={reviewMutation.isPending}
                        >
                          {reviewMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Submit Review
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                ) : (
                  <Card className="rounded-[2.5rem] border-dashed text-center p-8 bg-muted/20">
                    <UserIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-bold mb-2">
                      Sign in to Review
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      You need to be logged in to share your experience with
                      this API.
                    </p>
                    <Link href="/signin">
                      <Button className="rounded-xl">
                        Connect Wallet / Sign In
                      </Button>
                    </Link>
                  </Card>
                )}

                {/* Reviews List */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    Community Reviews{" "}
                    {stats?.totalCount ? (
                      <span className="text-muted-foreground text-sm font-normal">
                        ({stats.totalCount})
                      </span>
                    ) : null}
                  </h3>

                  {reviewsQuery.isLoading ? (
                    [1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-32 rounded-3xl bg-muted animate-pulse"
                      />
                    ))
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-20 bg-card/50 rounded-[2.5rem] border border-border/50">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <p className="text-muted-foreground">
                        No reviews yet. Be the first to review!
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {reviews.map((r) => (
                        <Card
                          key={r.id}
                          className="rounded-3xl border-border/50 bg-card group"
                        >
                          <CardHeader className="flex flex-row items-center gap-4 pb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                              {r.reviewerImage ? (
                                <img
                                  src={r.reviewerImage}
                                  alt={r.reviewerName || ""}
                                />
                              ) : (
                                <UserIcon className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="font-bold text-sm">
                                  {r.reviewerName || "Anonymous"}
                                </p>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                  {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${star <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/80 leading-relaxed italic">
                              "{r.comment}"
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar / Checkout */}
          <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-primary/20 shadow-2xl overflow-hidden bg-background relative border-2 ring-4 ring-primary/5">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full">
                  Developer Tier
                </div>
              </div>
              <CardHeader className="pt-10">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Access Price
                </CardTitle>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight">
                    {formatUnits(
                      endpoint.priceAmount,
                      endpoint.tokenDecimals ?? 18,
                    )}
                  </span>
                  <span className="text-xl font-bold text-muted-foreground">
                    {endpoint.tokenSymbol}
                  </span>
                  <span className="text-muted-foreground">/ call</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 py-4">
                  <div className="flex items-center text-sm gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>High Availability (99.9% Uptime)</span>
                  </div>
                  <div className="flex items-center text-sm gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Standard Latency Gateway</span>
                  </div>
                  <div className="flex items-center text-sm gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Pay-per-use, no recurring fees</span>
                  </div>
                </div>
                <Button
                  className="w-full py-7 text-lg rounded-2xl shadow-lg shadow-primary/20 group font-bold"
                  size="lg"
                >
                  Activate API
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-[10px] text-center text-muted-foreground pt-2">
                  Secure on-chain transaction on {endpoint.chainName}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border/50 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-lg">Deployment Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />{" "}
                    Average Rating
                  </span>
                  <span className="text-sm font-bold">
                    {stats?.averageRating.toFixed(1) || "0.0"} / 5.0
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-400" /> Total
                    Reviews
                  </span>
                  <span className="text-sm font-bold">
                    {stats?.totalCount || 0}
                  </span>
                </div>
                <Link
                  href={`#`}
                  className="flex justify-between items-center py-2 group"
                >
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-400" /> Security Audit
                  </span>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:text-primary transition-colors text-green-600">
                    Verified <Check className="h-3 w-3" />
                  </span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Component: API Test Panel ──────────────────────────────────────────

function ApiTestPanel({ endpoint }: { endpoint: MarketplaceEndpointDetail }) {
  const { fetchWithPayment, isPending } = useFetchWithPayment(client);
  const account = useActiveAccount();
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [bodyFields, setBodyFields] = useState<Record<string, any>>({});

  // Initialize query params and body fields with defaults/examples
  useEffect(() => {
    const initialQueryParams: Record<string, string> = {};
    endpoint.queryParams?.forEach((p) => {
      if (p.defaultValue) initialQueryParams[p.name] = p.defaultValue;
    });
    setQueryParams(initialQueryParams);

    const initialBody: Record<string, any> = {};
    endpoint.requestBody?.forEach((b) => {
      if (b.exampleValue) {
        try {
          // Try to parse as JSON if it looks like an object or array
          if (
            (b.exampleValue.startsWith("{") && b.exampleValue.endsWith("}")) ||
            (b.exampleValue.startsWith("[") && b.exampleValue.endsWith("]"))
          ) {
            initialBody[b.fieldName] = JSON.parse(b.exampleValue);
          } else {
            initialBody[b.fieldName] = b.exampleValue;
          }
        } catch {
          initialBody[b.fieldName] = b.exampleValue;
        }
      }
    });
    setBodyFields(initialBody);
  }, [endpoint]);

  const handleApiCall = async () => {
    setError(null);
    setData(null);

    try {
      // Construct base URL
      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.flow402.com";
      const path = endpoint.gatewayPath || "/";

      // Build query string
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });

      const queryString = searchParams.toString();
      const fullUrl = `${gatewayUrl}${path}${queryString ? `?${queryString}` : ""}`;
      const inferredMethod =
        endpoint.requestBody && endpoint.requestBody.length > 0
          ? "POST"
          : "GET";

      console.log(`Executing paid API call (${inferredMethod}) to:`, fullUrl);

      // Make the paid API call
      const requestInit: RequestInit = {
        method: inferredMethod,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (inferredMethod !== "GET") {
        requestInit.body = JSON.stringify(bodyFields);
      }

      const response = await fetchWithPayment(fullUrl, requestInit);

      setData(response);
      toast.success("API Call Successful");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Payment or API request failed");
      toast.error("API Call Failed");
    }
  };

  return (
    <Card className="rounded-[2.5rem] border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Zap className="h-5 w-5 text-primary" /> Test API Endpoint
        </CardTitle>
        <CardDescription>
          Make a paid request to this API. You will be prompted to pay{" "}
          {formatUnits(endpoint.priceAmount, endpoint.tokenDecimals ?? 18)}{" "}
          {endpoint.tokenSymbol} per call.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Query Parameters Section */}
        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              Query Parameters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {endpoint.queryParams.map((p) => (
                <div key={p.name} className="space-y-1.5">
                  <label className="text-xs font-bold ml-1 flex items-center gap-1">
                    {p.name}{" "}
                    {p.required && <span className="text-red-500">*</span>}
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1 opacity-50"
                    >
                      {p.type}
                    </Badge>
                  </label>
                  <Input
                    placeholder={`Enter ${p.name}...`}
                    className="rounded-xl bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                    value={queryParams[p.name] || ""}
                    onChange={(e) =>
                      setQueryParams((prev) => ({
                        ...prev,
                        [p.name]: e.target.value,
                      }))
                    }
                  />
                  {p.description && (
                    <p className="text-[10px] text-muted-foreground ml-1 opacity-70 italic">
                      {p.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Body Section */}
        {endpoint.requestBody && endpoint.requestBody.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border/10">
            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              Request Body (JSON)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {endpoint.requestBody.map((b) => (
                <div key={b.fieldName} className="space-y-1.5">
                  <label className="text-xs font-bold ml-1 flex items-center gap-1">
                    {b.fieldName}{" "}
                    {b.required && <span className="text-red-500">*</span>}
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1 opacity-50"
                    >
                      {b.fieldType}
                    </Badge>
                  </label>
                  <Input
                    placeholder={`Enter ${b.fieldName}...`}
                    className="rounded-xl bg-background/50 border-border/50 focus:border-primary/50 transition-colors font-mono text-xs"
                    value={
                      typeof bodyFields[b.fieldName] === "object"
                        ? JSON.stringify(bodyFields[b.fieldName])
                        : bodyFields[b.fieldName] || ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setBodyFields((prev) => ({
                        ...prev,
                        [b.fieldName]: val,
                      }));
                    }}
                  />
                  {b.description && (
                    <p className="text-[10px] text-muted-foreground ml-1 opacity-70 italic">
                      {b.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 space-y-4">
          <div className="flex justify-center bg-muted/20 p-4 rounded-2xl border-2 border-dashed border-primary/20 min-h-[60px] items-center">
            {isMounted ? (
              <ConnectButton
                client={client}
                theme="dark"
                connectButton={{
                  label: "Connect Wallet",
                  className: "h-9 px-3 text-xs",
                }}
              />
            ) : (
              <div className="h-9 w-32 bg-muted/50 animate-pulse rounded-lg" />
            )}
          </div>
          <Button
            onClick={handleApiCall}
            disabled={isPending}
            className="w-full py-8 text-lg rounded-2xl shadow-2xl shadow-primary/20 font-black group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary bg-size-200 animate-gradient-x opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center justify-center gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" /> Authorizing
                  Payment...
                </>
              ) : (
                <>
                  <Zap className="h-6 w-6 fill-current" /> Execute Paid API Call
                </>
              )}
            </span>
          </Button>
        </div>

        {/* Error Box */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Shield className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold">Request Failed</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Response Visualizer */}
        {data && (
          <div className="space-y-4 pt-6 border-t border-border/10 animate-in zoom-in-95 fill-mode-both duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-green-500" />
                <h4 className="text-sm font-extrabold uppercase tracking-tighter">
                  Response Payload
                </h4>
              </div>
              <Badge
                variant="outline"
                className="text-green-500 bg-green-500/10 border-green-500/20 font-black uppercase tracking-tighter"
              >
                HTTP 200 OK
              </Badge>
            </div>
            <div className="relative group">
              <pre className="p-6 rounded-2xl bg-zinc-950 text-zinc-300 font-mono text-xs overflow-auto max-h-[400px] shadow-2xl border border-zinc-800 scrollbar-thin scrollbar-thumb-primary/20">
                {JSON.stringify(data, null, 2)}
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                  toast.success("Response copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/30 border-t border-border/50 py-4 px-8">
        <p className="text-[10px] text-muted-foreground flex items-center gap-2 mx-auto font-medium">
          <Shield className="h-3 w-3" /> Secure x402 Payment Settlement via
          Thirdweb
        </p>
      </CardFooter>
    </Card>
  );
}
