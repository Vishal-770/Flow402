"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  Loader2,
  ExternalLink,
  ChevronLeft,
  Code,
  Pencil
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { formatUnits } from "@/src/lib/utils/units";

interface ApiCall {
  id: string;
  apiEndpointId: string;
  callerWallet: string;
  priceAmount: string;
  status: "success" | "failed" | "refunded";
  errorMessage: string | null;
  latencyMs: number | null;
  createdAt: string;
  apiDescription: string | null;
  apiCategory: string | null;
  apiGatewayPath: string;
}

interface Stats {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  refundedCalls: number;
  avgLatency: number | null;
  totalRevenue: string;
}

interface AnalyticsData {
  calls: ApiCall[];
  stats: Stats;
}

const ApiAnalyticsPage = () => {
  const { id } = useParams();
  const [limit] = useState(100);

  const { data: endpointData, isLoading: isLoadingEndpoint } = useQuery({
    queryKey: ["api-endpoint", id],
    queryFn: async () => {
      const res = await axios.get(`/api/api-endpoints/${id}`);
      return res.data.data;
    },
  });

  const { data, isLoading, error } = useQuery<{ success: boolean; data: AnalyticsData }>({
    queryKey: ["api-analytics", id, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: "0",
        apiEndpointId: id as string,
      });
      const res = await axios.get(`/api/analytics/api-calls?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const analyticsData = data?.data;
  const stats = analyticsData?.stats;
  const calls = analyticsData?.calls || [];

  const successRate = stats
    ? stats.totalCalls > 0
      ? ((stats.successCalls / stats.totalCalls) * 100).toFixed(1)
      : "0"
    : "0";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoadingEndpoint || isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 pt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
            <div className="space-y-4 w-full max-w-2xl">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
            <div className="p-8 border-b border-border bg-muted/20">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
            <div className="p-8 space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-12">
      <main className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div className="space-y-4">
            <Link 
                href="/api-endpoints" 
                className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
            >
                <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Listings
            </Link>
            <div className="flex items-center gap-4">
                <h1 className="text-4xl font-extrabold tracking-tight">Analytics</h1>
                <Badge variant="outline" className="rounded-lg px-3 py-1 font-mono text-xs font-bold border-primary/20 bg-primary/5 text-primary">
                    /{endpointData?.gatewayPath}
                </Badge>
            </div>
            <p className="text-muted-foreground font-medium max-w-2xl">
                Real-time performance metrics and call history for your API endpoint.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
             <Link href={`/api-endpoints/${id}/edit`}>
                <Button variant="outline" className="rounded-xl px-5 font-bold border-border hover:bg-muted/50">
                  <Pencil className="mr-2 h-4 w-4" /> Edit Endpoint
                </Button>
            </Link>
            <Link href={`/marketplace/${id}`}>
                <Button variant="outline" className="rounded-xl px-5 font-bold border-border hover:bg-muted/50">
                   <ExternalLink className="mr-2 h-4 w-4" /> Marketplace View
                </Button>
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl p-12 text-center border border-border bg-background shadow-sm">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Failed to load analytics</h3>
            <p className="text-muted-foreground font-medium">Please check your network connection and try again.</p>
          </div>
        ) : !stats || stats.totalCalls === 0 ? (
          <div className="rounded-2xl p-24 text-center border border-dashed border-border bg-background">
            <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-2">No data recorded yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
                This API hasn&apos;t received any marketplace calls. Use the marketplace view to test your integration.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Requests</span>
                </div>
                <div className="text-3xl font-bold tracking-tight">{stats.totalCalls.toLocaleString()}</div>
                <div className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">Lifetime calls recorded</div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Success Rate</span>
                </div>
                <div className="text-3xl font-bold tracking-tight">{successRate}%</div>
                <div className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">{stats.successCalls.toLocaleString()} passed</div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">P95 Latency</span>
                </div>
                <div className="text-3xl font-bold tracking-tight">
                    {stats.avgLatency ? `${Math.round(Number(stats.avgLatency))}ms` : "—"}
                </div>
                <div className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">Response performance</div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Settled Revenue</span>
                </div>
                <div className="text-3xl font-bold tracking-tight">
                    {formatUnits(stats.totalRevenue, 6)}
                </div>
                <div className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">Earnings generated (USDC)</div>
              </div>
            </div>

            {/* Recent API Calls */}
            <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
              <div className="p-8 border-b border-border bg-muted/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-1">Call Logs</h2>
                    <p className="text-sm text-muted-foreground font-medium">Real-time transmission history for this listing.</p>
                  </div>
                  <Badge variant="secondary" className="w-fit rounded-lg px-3 py-1 font-bold bg-background border border-border text-xs">
                    Latest {calls.length} entries
                  </Badge>
                </div>
              </div>
              <div className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="px-8 py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Caller</TableHead>
                        <TableHead className="py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-center">Status</TableHead>
                        <TableHead className="py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-right">Latency</TableHead>
                        <TableHead className="py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-right">Price</TableHead>
                        <TableHead className="py-4 h-auto text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-8">Time (UTC)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => (
                        <TableRow key={call.id} className="hover:bg-muted/30 border-border group transition-colors">
                          <TableCell className="px-8 py-4">
                            <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                                {truncateAddress(call.callerWallet)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            {call.status === "success" && (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                Success
                              </Badge>
                            )}
                            {call.status === "failed" && (
                              <Badge className="bg-red-500/10 text-red-600 border-red-500/20 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                Failed
                              </Badge>
                            )}
                            {call.status === "refunded" && (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                Refunded
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4 font-bold text-xs tabular-nums">
                            {call.latencyMs ? `${call.latencyMs}ms` : "—"}
                          </TableCell>
                          <TableCell className="text-right py-4 font-bold text-xs tabular-nums">
                            {formatUnits(call.priceAmount, 6)} <span className="text-[10px] text-muted-foreground uppercase">USDC</span>
                          </TableCell>
                          <TableCell className="px-8 py-4 text-xs font-bold text-muted-foreground tabular-nums">
                            {formatDate(call.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ApiAnalyticsPage;




