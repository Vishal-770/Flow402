"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import Image from "next/image";
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
  Database,
  Star,
  MessageSquare,
  User as UserIcon,
  Heart,
  List,
  FileJson,
  Search,
  Activity,
  Trash2,
  Edit3,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerId: string;
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
  const [isEditing, setIsEditing] = useState(false);
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
    } catch {
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
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["marketplace-reviews", id] });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message =
        axiosError.response?.data?.message || "Failed to submit review";
      toast.error(message);
    },
  });

  const editReviewMutation = useMutation({
    mutationFn: async (updatedReview: { rating: number; comment: string }) => {
      const res = await axios.put(`/api/marketplace/${id}/reviews`, updatedReview);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Review updated successfully");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["marketplace-reviews", id] });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message =
        axiosError.response?.data?.message || "Failed to update review";
      toast.error(message);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.delete(`/api/marketplace/${id}/reviews`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Review deleted successfully");
      setIsEditing(false);
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["marketplace-reviews", id] });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message =
        axiosError.response?.data?.message || "Failed to delete review";
      toast.error(message);
    },
  });

  const endpoint = detailQuery.data?.data;
  const reviews = reviewsQuery.data?.data ?? [];
  const stats = reviewsQuery.data?.stats;

  const existingReview = useMemo(() => {
    if (!session?.user?.id || !reviews) return null;
    return reviews.find((r) => r.reviewerId === session.user.id) || null;
  }, [reviews, session?.user?.id]);

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

    if (existingReview && isEditing) {
      editReviewMutation.mutate({ rating, comment });
    } else {
      reviewMutation.mutate({ rating, comment });
    }
  };

  const startEditing = () => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
      setIsEditing(true);
    }
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
      <div className="min-h-screen bg-background pb-20">
        <div className="relative bg-muted/30 pt-12 pb-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
            <div className="h-4 w-32 bg-secondary/50 rounded-md" />
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-secondary/30 border border-border shrink-0" />
              <div className="flex-1 space-y-4 w-full">
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-secondary/50 rounded-md" />
                  <div className="h-6 w-24 bg-secondary/50 rounded-md" />
                </div>
                <div className="h-12 md:h-14 w-3/4 max-w-md bg-secondary/50 rounded-xl" />
                <div className="flex gap-3">
                  <div className="h-6 w-32 bg-secondary/50 rounded-md" />
                  <div className="h-6 w-24 bg-secondary/50 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 -mt-12 space-y-8 animate-pulse">
           <div className="h-14 w-full lg:w-2/3 bg-secondary/50 rounded-2xl" />
           <div className="h-[400px] w-full lg:w-2/3 bg-secondary/30 rounded-2xl border border-border" />
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
            doesn&apos;t exist.
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

  const gatewayBaseUrl = (process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.flow402.com").replace(/\/$/, "");
  const normalizedPath = endpoint.gatewayPath?.startsWith("/") ? endpoint.gatewayPath : `/${endpoint.gatewayPath}`;
  const curlExample = `curl -X POST "${gatewayBaseUrl}${normalizedPath}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"query": "example"}'`;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="pt-8 md:pt-12 pb-12 md:pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 md:mb-8 transition-colors group"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Marketplace
          </Link>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
              {endpoint.imageUrl ? (
                <Image
                  src={endpoint.imageUrl}
                  alt={endpoint.description || "API"}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Code2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
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
              <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                  {endpoint.description || "Unnamed API Endpoint"}
                </h1>
                <button
                  onClick={handleToggleFavorite}
                  disabled={toggleFavoriteMutation.isPending}
                  className={`p-2.5 md:p-3 rounded-xl border transition-colors shrink-0 w-fit disabled:opacity-50 ${
                    isFavorite
                      ? "bg-red-500/10 border-red-500/20 text-red-500"
                      : "bg-secondary border-border text-muted-foreground hover:text-red-500 hover:bg-secondary/80"
                  }`}
                  title={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  {toggleFavoriteMutation.isPending ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Heart
                      className={`h-6 w-6 ${isFavorite ? "fill-current" : ""}`}
                    />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                    {endpoint.providerName?.[0] || "P"}
                  </div>
                  <span className="text-sm font-medium">
                    {endpoint.providerName || "Anonymous"}
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

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-6 md:-mt-10 lg:-mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full flex justify-start overflow-x-auto scrollbar-hide bg-secondary/30 border border-border p-1 rounded-2xl h-auto mb-8">
                <TabsTrigger
                  value="overview"
                  className="rounded-xl px-4 md:px-8 h-12 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="test"
                  className="rounded-xl px-4 md:px-8 h-12 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Try it Out
                </TabsTrigger>
                <TabsTrigger
                  value="integration"
                  className="rounded-xl px-4 md:px-8 h-12 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Integration
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="rounded-xl px-4 md:px-8 h-12 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Technical Specs
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-xl px-4 md:px-8 h-12 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
                >
                  Reviews{" "}
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 h-4 min-w-[16px] flex items-center justify-center bg-black/10 dark:bg-white/10"
                  >
                    {stats?.totalCount || 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="overview"
                className="space-y-8 mt-0 outline-none"
              >
                <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-6">API Overview</h3>
                  <div className="space-y-6">
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {endpoint.description || "No description provided."}
                    </p>

                  </div>
                </div>

                {/* Sample Response */}
                {endpoint.sampleResponse && (
                  <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-6">
                      <Database className="h-5 w-5 text-primary" /> Sample Result
                    </h3>
                    <pre className="p-6 rounded-xl bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto border border-zinc-800">
                      {endpoint.sampleResponse}
                    </pre>
                  </div>
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
                <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-1">
                      <List className="h-5 w-5 text-primary" /> Upstream Headers
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      These headers are sent by the gateway to the provider.
                    </p>
                  </div>
                  {endpoint.upstreamHeaders &&
                  endpoint.upstreamHeaders.length > 0 ? (
                    <div className="rounded-xl border border-border overflow-hidden bg-background">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/30 border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {endpoint.upstreamHeaders.map((h, i) => (
                            <tr
                              key={i}
                              className="hover:bg-secondary/30 transition-colors"
                            >
                              <td className="px-4 py-3 font-mono text-primary text-xs uppercase tracking-tight font-bold">
                                {h.headerName}
                              </td>
                              <td className="px-4 py-3 text-foreground truncate max-w-[200px] font-medium">
                                {h.headerValue}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl border border-dashed border-border bg-secondary/10 text-muted-foreground font-semibold text-sm">
                      No upstream headers defined
                    </div>
                  )}
                </div>

                {/* Query Params */}
                <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-1">
                      <Search className="h-5 w-5 text-primary" /> Query Parameters
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Supported dynamic parameters for this API.
                    </p>
                  </div>
                  {endpoint.queryParams && endpoint.queryParams.length > 0 ? (
                    <div className="rounded-xl border border-border overflow-hidden bg-background">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/30 border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Required
                            </th>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Default
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {endpoint.queryParams.map((p, i) => (
                            <tr
                              key={i}
                              className="hover:bg-secondary/30 transition-colors font-medium"
                            >
                              <td className="px-4 py-3 font-mono text-primary font-bold">
                                {p.name}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-bold uppercase bg-secondary/30 border-border"
                                >
                                  {p.type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {p.required ? (
                                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20 uppercase text-[10px] font-bold">
                                    Yes
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-[10px] font-bold uppercase">
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
                    <div className="p-8 text-center rounded-xl border border-dashed border-border bg-secondary/10 text-muted-foreground font-semibold text-sm">
                      No query parameters defined
                    </div>
                  )}
                </div>

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
                <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-1">
                      <Code2 className="h-5 w-5 text-primary" /> Integration Guide
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Use the following sample to integrate this API into your application.
                    </p>
                  </div>
                  <div>
                    <Tabs defaultValue="curl" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 rounded-lg bg-secondary/30 mb-4 p-1">
                        <TabsTrigger value="curl" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                          cURL
                        </TabsTrigger>
                        <TabsTrigger value="js" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                          JavaScript
                        </TabsTrigger>
                        <TabsTrigger value="python" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                          Python
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl" className="relative group mt-0">
                        <pre className="p-6 rounded-xl bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto border border-zinc-800">
                          {curlExample}
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white hover:bg-white/10"
                          onClick={() => copyToClipboard(curlExample)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TabsContent>
                      <TabsContent value="js" className="mt-0">
                        <pre className="p-6 rounded-xl bg-zinc-950 text-zinc-500 font-mono text-xs overflow-x-auto border border-zinc-800">
                           // SDK Integration Guide coming soon...
                        </pre>
                      </TabsContent>
                      <TabsContent value="python" className="mt-0">
                        <pre className="p-6 rounded-xl bg-zinc-950 text-zinc-500 font-mono text-xs overflow-x-auto border border-zinc-800">
                          # SDK Integration Guide coming soon...
                        </pre>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="reviews"
                className="mt-0 outline-none space-y-8"
              >
                {/* Review Form */}
                {session ? (
                  existingReview && !isEditing ? (
                    <div className="rounded-2xl border border-border bg-background p-6 md:p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Check className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">You reviewed this API</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        Thank you for your feedback! You can update your review if your experience has changed.
                      </p>
                      <Button onClick={startEditing} variant="outline" className="rounded-md font-semibold px-6">
                        <MessageSquare className="h-4 w-4 mr-2" /> Edit Your Review
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
                      <form onSubmit={handleReviewSubmit}>
                        <div className="mb-6">
                          <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
                            <MessageSquare className="h-5 w-5 text-primary" />{" "}
                            {isEditing ? "Update Your Review" : "Post a Review"}
                          </h3>
                          <p className="text-sm text-primary/60">
                            {isEditing 
                              ? "Modify your previous rating and feedback below." 
                              : "Share your experience with this API with the community."}
                          </p>
                        </div>
                        <div className="space-y-6 mb-6">
                          <div className="space-y-3">
                            <p className="text-sm font-bold">Rating</p>
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
                            <p className="text-sm font-bold">Your Feedback</p>
                            <Textarea
                              placeholder="What was your experience using this API? Are the responses accurate and timely?"
                              className="rounded-xl min-h-[120px] bg-background border-primary/20 focus-visible:ring-primary/30"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 gap-3">
                          {isEditing && (
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-md font-semibold px-6 h-10"
                              onClick={() => {
                                setIsEditing(false);
                                setRating(5);
                                setComment("");
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            type="submit"
                            className="rounded-md font-semibold px-8 h-10"
                            disabled={isEditing ? (editReviewMutation.isPending || (rating === existingReview?.rating && comment === existingReview?.comment)) : reviewMutation.isPending}
                          >
                            {(isEditing ? editReviewMutation.isPending : reviewMutation.isPending) ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {isEditing ? "Update Review" : "Submit Review"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/10 p-8 text-center flex flex-col items-center">
                    <UserIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-bold mb-2">
                      Sign in to Review
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-sm mb-6">
                      You need to be logged in to share your experience with this API.
                    </p>
                    <Link href="/signin">
                      <Button className="rounded-md font-semibold h-9 px-6 bg-primary text-primary-foreground">
                        Connect Wallet / Sign In
                      </Button>
                    </Link>
                  </div>
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
                        className="h-32 rounded-2xl bg-secondary/30 border border-border animate-pulse"
                      />
                    ))
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-dashed border-border">
                      <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                      <p className="text-muted-foreground text-sm font-semibold">
                        No reviews yet. Be the first to review!
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {reviews.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-2xl border border-border bg-background p-6 group transition-colors hover:bg-secondary/30 flex flex-col gap-4"
                        >
                          <div className="flex flex-row items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-secondary text-primary border border-border flex items-center justify-center overflow-hidden shrink-0">
                              {r.reviewerImage ? (
                                <Image
                                  src={r.reviewerImage}
                                  alt={r.reviewerName || ""}
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <UserIcon className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm truncate text-foreground">
                                    {r.reviewerName || "Anonymous"}
                                  </p>
                                  {session?.user?.id === r.reviewerId && (
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1 rounded bg-primary/10 text-primary border-none">You</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight h-5 flex items-center">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                  </span>
                                  {session?.user?.id === r.reviewerId && (
                                    <div className="flex items-center gap-1 ml-2">
                                      <button 
                                        onClick={startEditing}
                                        disabled={isEditing}
                                        className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
                                        title="Edit Review"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <button 
                                            disabled={deleteReviewMutation.isPending}
                                            className="p-1 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-500 disabled:opacity-50"
                                            title="Delete Review"
                                          >
                                            {deleteReviewMutation.isPending ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                          </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-2xl border-border bg-background">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle className="text-xl font-bold">Delete Review?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-muted-foreground">
                                              This will permanently remove your review and rating from this API endpoint. This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => deleteReviewMutation.mutate()}
                                              className="rounded-xl bg-red-500 text-white hover:bg-red-600 border-none"
                                            >
                                              Delete Review
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3.5 w-3.5 ${star <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                              &quot;{r.comment}&quot;
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 w-full lg:sticky lg:top-24 h-fit">

            <div className="rounded-2xl border border-border bg-background p-6 md:p-8 flex flex-col gap-6">
              <h3 className="text-base font-bold text-foreground">
                Deployment Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                    <Star className="h-4 w-4 text-muted-foreground/70" />{" "}
                    Average Rating
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {stats?.averageRating.toFixed(1) || "0.0"} / 5.0
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                    <MessageSquare className="h-4 w-4 text-muted-foreground/70" /> Total
                    Reviews
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {stats?.totalCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                    <Globe className="h-4 w-4 text-muted-foreground/70" /> Network Supported
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase bg-secondary/30">
                    {endpoint.chainName}
                  </Badge>
                </div>
              </div>
            </div>
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
  const [data, setData] = useState<object | string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, [account]);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [bodyFields, setBodyFields] = useState<Record<string, unknown>>({});

  // Initialize query params and body fields with defaults/examples
  useEffect(() => {
    const initialQueryParams: Record<string, string> = {};
    endpoint.queryParams?.forEach((p) => {
      if (p.defaultValue) initialQueryParams[p.name] = p.defaultValue;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueryParams(initialQueryParams);

    const initialBody: Record<string, unknown> = {};
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
      const gatewayUrl = (process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.flow402.com").replace(/\/$/, "");
      const path = endpoint.gatewayPath || "/";
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;

      // Build query string
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });

      const queryString = searchParams.toString();
      const fullUrl = `${gatewayUrl}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
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

      setData(response as object | string);
      toast.success("API Call Successful");
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Payment or API request failed";
      setError(errMsg);
      toast.error("API Call Failed");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-6 md:p-8 flex flex-col gap-8">
      <div>
        <h3 className="flex items-center gap-2 text-xl font-bold mb-1">
          <Zap className="h-5 w-5 text-primary" /> Test API Endpoint
        </h3>
        <p className="text-sm text-muted-foreground">
          Make a paid request to this API. You will be prompted to pay{" "}
          {formatUnits(endpoint.priceAmount, endpoint.tokenDecimals ?? 18)}{" "}
          {endpoint.tokenSymbol} per call.
        </p>
      </div>
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
                        : (bodyFields[b.fieldName] as string) || ""
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
            className="w-full h-14 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Authorizing Payment...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 fill-current" /> Execute Paid API Call
              </>
            )}
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
                {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
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
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-2 font-medium">
          <Shield className="h-3 w-3" /> Secure x402 Payment Settlement via Thirdweb
        </p>
      </div>
    </div>
  );
}
