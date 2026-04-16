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
        <div className="bg-muted/10 pt-8 md:pt-12 pb-12 md:pb-16 px-4 md:px-6">
          <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
            <div className="h-4 w-32 bg-secondary/50 rounded-md" />
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-secondary/50 border border-border shrink-0" />
              <div className="flex-1 space-y-6 w-full">
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-secondary/50 rounded-md" />
                  <div className="h-6 w-24 bg-secondary/50 rounded-md" />
                </div>
                <div className="h-10 md:h-12 w-3/4 max-w-sm bg-secondary/50 rounded-lg" />
                <div className="h-4 w-48 bg-secondary/30 rounded-md" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 space-y-8 animate-pulse">
           <div className="h-12 w-full lg:w-2/3 bg-secondary/40 rounded-xl" />
           <div className="h-[400px] w-full lg:w-2/3 bg-secondary/20 rounded-xl border border-border" />
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !endpoint) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 rounded-xl border-dashed">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold mb-2">API Not Found</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            The endpoint you are looking for might have been de-listed or
            doesn&apos;t exist in our registry.
          </p>
          <Button
            onClick={() => router.push("/marketplace")}
            variant="outline"
            className="rounded-lg"
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
      <div className="bg-muted/10 pt-8 md:pt-12 pb-12 md:pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 md:mb-8 transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Registry
          </Link>
 
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden shrink-0">
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
                  className="bg-background border-border text-foreground font-medium"
                >
                  {endpoint.category || "General"}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-background"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {endpoint.chainName}
                </Badge>
                <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-xs font-medium border border-border">
                  {stats?.averageRating.toFixed(1) || "0.0"} ({stats?.totalCount || 0})
                </div>
                <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full text-xs font-bold border border-primary/20 text-primary">
                  <Zap className="h-3 w-3 fill-current" />
                  {formatUnits(endpoint.priceAmount, endpoint.tokenDecimals ?? 18)} {endpoint.tokenSymbol} / Call
                </div>
                {endpoint.tags &&
                  endpoint.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground text-[10px] uppercase font-bold"
                    >
                      {tag}
                    </Badge>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 rounded-md text-[10px] font-bold uppercase gap-1.5 transition-colors"
                  onClick={handlePing}
                  disabled={pingLoading}
                >
                  {pingLoading ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <Activity className="h-2.5 w-2.5" />
                  )}
                  {pingResult ? `Status: ${pingResult.status}` : "Verify Health"}
                </Button>
              </div>
              <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {endpoint.description || "Unnamed API Endpoint"}
                </h1>
                <button
                  onClick={handleToggleFavorite}
                  disabled={toggleFavoriteMutation.isPending}
                  className={`p-2.5 rounded-lg border transition-colors shrink-0 ${
                    isFavorite
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {toggleFavoriteMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Heart
                      className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`}
                    />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3 text-muted-foreground h-5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border border-border">
                    {endpoint.providerName?.[0] || "P"}
                  </div>
                  <span className="text-sm font-medium leading-none">
                    {endpoint.providerName || "Anonymous"}
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30 shrink-0" />
                <Link
                  href={endpoint.docsUrl || "#"}
                  target="_blank"
                  className="text-sm hover:underline flex items-center gap-1 leading-none"
                >
                  Documentation <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <div className="overflow-x-auto scrollbar-hide mb-8">
                <TabsList className="flex w-full bg-muted border border-border p-1 rounded-xl h-auto flex-nowrap">
                  <TabsTrigger
                    value="overview"
                    className="flex-1 rounded-lg px-2.5 md:px-8 h-10 text-xs md:text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="test"
                    className="flex-1 rounded-lg px-2.5 md:px-8 h-10 text-xs md:text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Testing
                  </TabsTrigger>
                  <TabsTrigger
                    value="integration"
                    className="flex-1 rounded-lg px-2.5 md:px-8 h-10 text-xs md:text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Integration
                  </TabsTrigger>
                  <TabsTrigger
                    value="specs"
                    className="flex-1 rounded-lg px-2.5 md:px-8 h-10 text-xs md:text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Technical
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="flex-1 rounded-lg px-2.5 md:px-8 h-10 text-xs md:text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2"
                  >
                    Reviews{" "}
                    <Badge
                      variant="secondary"
                      className="px-1 py-0 h-4 min-w-[14px] text-[9px]"
                    >
                      {stats?.totalCount || 0}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
 
              <TabsContent
                value="overview"
                className="space-y-6 mt-0 outline-none"
              >
                <div className="rounded-xl border border-border bg-card p-6 md:p-10">
                  <h3 className="text-xl font-bold mb-4">API Overview</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {endpoint.description || "The provider has not yet published an overview for this specific endpoint. Please refer to the global documentation for more details on the service capabilities."}
                  </p>
                </div>
 
                {/* Sample Response */}
                {endpoint.sampleResponse && (
                  <div className="rounded-xl border border-border bg-card p-6 md:p-10">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-4">
                      <Database className="h-5 w-5 text-muted-foreground" /> Sample Result
                    </h3>
                    <pre className="p-6 rounded-lg bg-muted text-foreground font-mono text-xs overflow-x-auto border border-border">
                      {endpoint.sampleResponse}
                    </pre>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="test" className="mt-0 outline-none">
                <ApiTestPanel endpoint={endpoint} />
              </TabsContent>

              <TabsContent
                value="integration"
                className="mt-0 outline-none"
              >
                <div className="rounded-xl border border-border bg-card p-6 md:p-10">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-1">
                      <Code2 className="h-5 w-5 text-muted-foreground" /> Integration Guide
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Standard implementation patterns for integrating this endpoint.
                    </p>
                  </div>
                  <div>
                    <Tabs defaultValue="curl" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 rounded-lg bg-muted mb-4 p-1">
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
                        <pre className="p-6 rounded-lg bg-muted text-foreground font-mono text-xs overflow-x-auto border border-border">
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
                      <TabsContent value="js" className="mt-0">
                        <pre className="p-6 rounded-lg bg-muted text-muted-foreground font-mono text-xs overflow-x-auto border border-border">
                           // x402 SDK Integration Guide coming soon...
                        </pre>
                      </TabsContent>
                      <TabsContent value="python" className="mt-0">
                        <pre className="p-6 rounded-lg bg-muted text-muted-foreground font-mono text-xs overflow-x-auto border border-border">
                          # x402 SDK Integration Guide coming soon...
                        </pre>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="specs"
                className="space-y-6 mt-0 outline-none"
              >
                {/* Headers */}
                <div className="rounded-xl border border-border bg-card p-6 md:p-10">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-1">
                      <List className="h-5 w-5 text-muted-foreground" /> Protocol Headers
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Authoritative headers enforced by the gateway for this endpoint.
                    </p>
                  </div>
                  {endpoint.upstreamHeaders &&
                  endpoint.upstreamHeaders.length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Header Name
                            </th>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Protocol Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {endpoint.upstreamHeaders.map((h, i) => (
                            <tr
                              key={i}
                              className="bg-background"
                            >
                              <td className="px-4 py-3 font-mono text-foreground text-xs font-bold">
                                {h.headerName}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px] font-mono text-xs">
                                {h.headerValue}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-lg border border-dashed text-muted-foreground text-sm">
                      No upstream headers defined
                    </div>
                  )}
                </div>
 
                {/* Query Params */}
                <div className="rounded-xl border border-border bg-card p-6 md:p-10">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-1">
                      <Search className="h-5 w-5 text-muted-foreground" /> Query Parameters
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Accepted dynamic parameters for API resolution.
                    </p>
                  </div>
                  {endpoint.queryParams && endpoint.queryParams.length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left font-bold tracking-wider uppercase text-[10px] text-muted-foreground">
                              Status
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
                              className="bg-background"
                            >
                              <td className="px-4 py-3 font-mono text-foreground font-bold text-sm">
                                {p.name}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-bold uppercase rounded"
                                >
                                  {p.type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {p.required ? (
                                  <Badge className="bg-foreground text-background uppercase text-[10px] font-bold rounded">
                                    Required
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-[10px] font-bold uppercase">
                                    Optional
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
                    <div className="p-8 text-center rounded-lg border border-dashed text-muted-foreground text-sm">
                      No query parameters defined
                    </div>
                  )}
                </div>
 
                {/* Request Body */}
                <div className="rounded-xl border border-border bg-card p-6 md:p-10">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-1 text-foreground">
                      <FileJson className="h-5 w-5 text-muted-foreground" /> Request Body Schema
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      JSON payload fields required for state mutation.
                    </p>
                  </div>
                  {endpoint.requestBody && endpoint.requestBody.length > 0 ? (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted border-b border-border">
                            <tr>
                              <th className="px-4 py-3 text-left font-bold tracking-widest uppercase text-[10px] text-muted-foreground">
                                Property
                              </th>
                              <th className="px-4 py-3 text-left font-bold tracking-widest uppercase text-[10px] text-muted-foreground">
                                Type
                              </th>
                              <th className="px-4 py-3 text-left font-bold tracking-widest uppercase text-[10px] text-muted-foreground">
                                Required
                              </th>
                              <th className="px-4 py-3 text-left font-bold tracking-widest uppercase text-[10px] text-muted-foreground">
                                Example
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {endpoint.requestBody.map((b, i) => (
                              <tr
                                key={i}
                                className="bg-background"
                              >
                                <td className="px-4 py-3 font-mono text-foreground font-bold">
                                  {b.fieldName}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-bold uppercase rounded"
                                  >
                                    {b.fieldType}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  {b.required ? (
                                    <Badge className="bg-foreground text-background uppercase text-[10px] font-bold rounded">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-[10px] font-bold uppercase">
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
                      <div className="p-8 text-center rounded-lg border border-dashed text-muted-foreground text-sm">
                        No request body fields defined
                      </div>
                    )}
                </div>
              </TabsContent>

              <TabsContent
                value="reviews"
                className="mt-0 outline-none space-y-8"
              >
                {/* Review Form */}
                {session ? (
                  existingReview && !isEditing ? (
                    <div className="rounded-xl border border-border bg-card p-6 md:p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-muted text-foreground flex items-center justify-center mb-4 border border-border">
                        <Check className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Verified Review</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        You have already submitted a review for this endpoint.
                      </p>
                      <Button onClick={startEditing} variant="outline" className="rounded-lg font-semibold px-6">
                        <Edit3 className="h-4 w-4 mr-2" /> Modify Review
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-card p-6 md:p-10">
                      <form onSubmit={handleReviewSubmit}>
                        <div className="mb-6">
                          <h3 className="text-xl font-bold flex items-center gap-2 mb-1 text-foreground">
                            {isEditing ? "Update Feedback" : "Submit Feedback"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isEditing 
                              ? "Revise your rating and functional assessment." 
                              : "Contribute to the registry by rating this endpoint's performance."}
                          </p>
                        </div>
                        <div className="space-y-6 mb-6">
                          <div className="space-y-3">
                            <p className="text-sm font-bold text-foreground">Performance Rating</p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setRating(i)}
                                  className="transition-colors"
                                >
                                  <Star
                                    className={`h-7 w-7 ${i <= rating ? "fill-foreground text-foreground" : "text-muted border-none"}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-sm font-bold text-foreground">Functional Assessment</p>
                            <Textarea
                              placeholder="Provide technical feedback on latency, uptime, and data accuracy..."
                              className="rounded-lg min-h-[100px] bg-background border-border focus-visible:ring-ring"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 gap-3">
                          {isEditing && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-lg font-semibold px-6 h-10"
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
                            className="rounded-lg font-semibold px-8 h-10 bg-primary text-primary-foreground"
                            disabled={isEditing ? (editReviewMutation.isPending || (rating === existingReview?.rating && comment === existingReview?.comment)) : reviewMutation.isPending}
                          >
                            {(isEditing ? editReviewMutation.isPending : reviewMutation.isPending) ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {isEditing ? "Update Review" : "Post Review"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center flex flex-col items-center">
                    <UserIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
                    <h3 className="text-lg font-bold mb-2">Registry Authentication</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mb-6">
                      User authentication is required to submit feedback to the global registry.
                    </p>
                    <Link href="/signin">
                      <Button className="rounded-lg font-semibold h-10 px-6 bg-primary text-primary-foreground">
                        Sign In to Contribute
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
                        className="h-24 rounded-xl bg-muted/30 border border-border"
                      />
                    ))
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
                      <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <p className="text-muted-foreground text-sm font-medium">
                        No technical audits submitted for this endpoint yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {reviews.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4"
                        >
                          <div className="flex flex-row items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-muted text-foreground border border-border flex items-center justify-center overflow-hidden shrink-0">
                              {r.reviewerImage ? (
                                <Image
                                  src={r.reviewerImage}
                                  alt={r.reviewerName || ""}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              ) : (
                                <UserIcon className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm truncate text-foreground">
                                    {r.reviewerName || "Verified User"}
                                  </p>
                                  {session?.user?.id === r.reviewerId && (
                                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-muted border-border text-muted-foreground">Author</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-muted-foreground font-medium h-5 flex items-center">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                  </span>
                                  {session?.user?.id === r.reviewerId && (
                                    <div className="flex items-center gap-1 ml-2">
                                      <button 
                                        onClick={startEditing}
                                        disabled={isEditing}
                                        className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
 
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <button 
                                            disabled={deleteReviewMutation.isPending}
                                            className="p-1 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-xl">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Audit?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will permanently remove your technical feedback from the registry.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => deleteReviewMutation.mutate()}
                                              className="rounded-lg bg-destructive text-destructive-foreground"
                                            >
                                              Delete
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
                                    className={`h-3 w-3 ${star <= r.rating ? "fill-foreground text-foreground" : "text-muted"}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                               <p className="text-sm text-muted-foreground leading-relaxed italic">
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
            {/* Price Card */}
            <div className="rounded-xl border border-border bg-card p-6 md:p-8 flex flex-col gap-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-b pb-2 border-border/50">
                Resource Access
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Protocol Fee per Execution</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      {formatUnits(endpoint.priceAmount, endpoint.tokenDecimals ?? 18)}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground uppercase">{endpoint.tokenSymbol}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                    <Shield className="h-3 w-3" /> 
                    <span>On-chain Payment Settlement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Card */}
            <div className="rounded-xl border border-border bg-card p-6 md:p-8 flex flex-col gap-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-b pb-2 border-border/50">
                Performance Data
              </h3>
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                    <Star className="h-3.5 w-3.5" /> Verified Rating
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {stats?.averageRating.toFixed(1) || "0.0"} / 5.0
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                    <MessageSquare className="h-3.5 w-3.5" /> Functional Audits
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {stats?.totalCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                    <Globe className="h-3.5 w-3.5" /> Registry Network
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase rounded-sm">
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
      toast.success("Execution Successful");
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Execution failed";
      setError(errMsg);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-10 flex flex-col gap-8 shadow-none">
      <div>
        <h3 className="flex items-center gap-2 text-xl font-bold mb-1 text-foreground">
          <Zap className="h-5 w-5" /> Operational Testing
        </h3>
        <p className="text-sm text-muted-foreground">
          Execute a verified request to the provider gateway. A protocol fee of{" "}
          {formatUnits(endpoint.priceAmount, endpoint.tokenDecimals ?? 18)}{" "}
          {endpoint.tokenSymbol} applies per execution.
        </p>
      </div>
        {/* Query Parameters Section */}
        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              Query Authorization
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {endpoint.queryParams.map((p) => (
                <div key={p.name} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase ml-1 flex items-center gap-1 text-muted-foreground">
                    {p.name}{" "}
                    {p.required && <span className="text-destructive">*</span>}
                    <span className="opacity-50">({p.type})</span>
                  </label>
                  <Input
                    placeholder={`${p.name}`}
                    className="rounded-lg bg-background border-border focus:ring-1 focus:ring-ring h-10"
                    value={queryParams[p.name] || ""}
                    onChange={(e) =>
                      setQueryParams((prev) => ({
                        ...prev,
                        [p.name]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* Request Body Section */}
        {endpoint.requestBody && endpoint.requestBody.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              Payload Specifications
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {endpoint.requestBody.map((b) => (
                <div key={b.fieldName} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase ml-1 flex items-center gap-1 text-muted-foreground">
                    {b.fieldName}{" "}
                    {b.required && <span className="text-destructive">*</span>}
                    <span className="opacity-50">({b.fieldType})</span>
                  </label>
                  <Input
                    placeholder={`${b.fieldName}`}
                    className="rounded-lg bg-background border-border focus:ring-1 focus:ring-ring h-10 font-mono text-xs"
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
                </div>
              ))}
            </div>
          </div>
        )}
 
        <div className="pt-6 space-y-4">
          <div className="flex justify-center bg-muted p-6 rounded-lg border border-border border-dashed">
            {isMounted ? (
              <ConnectButton
                client={client}
                theme="dark"
                connectButton={{
                  label: "Connect Protocol Wallet",
                  className: "h-10 px-6 text-sm rounded-lg",
                }}
              />
            ) : (
              <div className="h-10 w-32 bg-muted-foreground/10 animate-pulse rounded-lg" />
            )}
          </div>
          <Button
            onClick={handleApiCall}
            disabled={isPending}
            className="w-full h-12 rounded-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Authorizing Settlement...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" /> Execute Paid Execution
              </>
            )}
          </Button>
        </div>
 
        {/* Error Box */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
            <Shield className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold">Execution Error</p>
              <p className="text-xs opacity-80 font-mono">{error}</p>
            </div>
          </div>
        )}
 
        {/* Response Visualizer */}
        {data && (
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Gateway Response
                </h4>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-bold border-border bg-muted rounded"
              >
                STATUS: 200 SUCCESS
              </Badge>
            </div>
            <div className="relative group">
              <pre className="p-6 rounded-lg bg-muted text-foreground font-mono text-xs overflow-auto max-h-[300px] border border-border">
                {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                  toast.success("Payload copied");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      <div className="pt-4 border-t border-border mt-2">
        <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-2 font-medium uppercase tracking-tighter">
          <Shield className="h-3 w-3" /> Encrypted x402 Gateway Transaction via Thirdweb Protocol
        </p>
      </div>
    </div>
  );
}
