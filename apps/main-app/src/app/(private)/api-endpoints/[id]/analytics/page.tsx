"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  DollarSign,
  BarChart3,
  Loader2,
  ExternalLink,
  ChevronLeft,
  Code
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-12">
      <main className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <Link 
                href="/api-endpoints" 
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors group"
            >
                <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Listings
            </Link>
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">API Analytics</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="rounded-xl px-3 font-bold bg-muted/50">
                    {endpointData?.gatewayPath}
                </Badge>
                <span className="text-muted-foreground text-sm font-medium">
                    {endpointData?.description}
                </span>
            </div>
          </div>

          <div className="flex gap-3">
             <Link href={`/api-endpoints/${id}/edit`}>
                <Button variant="outline" className="rounded-xl px-6">Edit Endpoint</Button>
            </Link>
            <Link href={`/marketplace/${id}`}>
                <Button variant="outline" className="rounded-xl px-6 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" /> Marketplace View
                </Button>
            </Link>
          </div>
        </div>

        {error ? (
          <Card className="rounded-[3rem] p-12 text-center border-destructive/50 bg-destructive/5">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Failed to load analytics</h3>
            <p className="text-muted-foreground">Please try again later</p>
          </Card>
        ) : !stats || stats.totalCalls === 0 ? (
          <Card className="rounded-[3rem] p-24 text-center border-dashed bg-muted/10">
            <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
            <h3 className="text-2xl font-black mb-2">No calls yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                This API hasn't received any calls yet. Once it's used in the marketplace, you'll see detailed performance data here.
            </p>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="rounded-[2.5rem] border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/20 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-500" />
                    Total Calls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{stats.totalCalls.toLocaleString()}</div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2 flex items-center gap-1">
                    All-time usage history
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/20 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{successRate}%</div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2">
                    {stats.successCalls.toLocaleString()} successful calls
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/20 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3 text-amber-500" />
                    Avg Latency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">
                    {stats.avgLatency ? `${Math.round(Number(stats.avgLatency))}ms` : "N/A"}
                  </div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2">
                    Response time performance
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/20 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-primary" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">
                    {formatUnits(stats.totalRevenue, 6)}
                  </div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2 flex items-center gap-1">
                    USDC earnings generated
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent API Calls */}
            <Card className="rounded-[3rem] border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-black leading-none tracking-tight">
                  <Code className="h-6 w-6 text-primary" />
                  Recent Call History
                  <Badge variant="secondary" className="ml-auto rounded-xl px-4 py-1.5 font-bold">
                    Showing last {calls.length} calls
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base font-medium mt-2">Detailed log of all requests transmitted through this API endpoint.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t border-border/50">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="px-8 py-5 h-auto text-[10px] uppercase font-black tracking-widest">Caller</TableHead>
                        <TableHead className="py-5 h-auto text-[10px] uppercase font-black tracking-widest text-center">Status</TableHead>
                        <TableHead className="py-5 h-auto text-[10px] uppercase font-black tracking-widest text-right">Latency</TableHead>
                        <TableHead className="py-5 h-auto text-[10px] uppercase font-black tracking-widest text-right">Price Paid</TableHead>
                        <TableHead className="py-5 h-auto text-[10px] uppercase font-black tracking-widest">Time (UTC)</TableHead>
                        <TableHead className="px-8 py-5 h-auto text-[10px] uppercase font-black tracking-widest">Error Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => (
                        <TableRow key={call.id} className="hover:bg-muted/20 border-border/50 transition-colors">
                          <TableCell className="px-8 font-mono text-sm font-bold text-primary/80">
                            {truncateAddress(call.callerWallet)}
                          </TableCell>
                          <TableCell className="text-center">
                            {call.status === "success" && (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-xl px-3 py-1 font-bold">
                                Success
                              </Badge>
                            )}
                            {call.status === "failed" && (
                              <Badge className="bg-red-500/10 text-red-500 border-red-500/20 rounded-xl px-3 py-1 font-bold">
                                Failed
                              </Badge>
                            )}
                            {call.status === "refunded" && (
                              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-xl px-3 py-1 font-bold">
                                Refunded
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-black text-sm">
                            {call.latencyMs ? `${call.latencyMs}ms` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-black text-sm">
                            {formatUnits(call.priceAmount, 6)} <span className="text-[10px] text-muted-foreground uppercase">USDC</span>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-muted-foreground">
                            {formatDate(call.createdAt)}
                          </TableCell>
                          <TableCell className="px-8 max-w-[300px] truncate text-xs font-bold text-destructive">
                            {call.errorMessage || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default ApiAnalyticsPage;
