"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Loader2,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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

interface PerApiStats {
  apiEndpointId: string;
  apiDescription: string | null;
  apiCategory: string | null;
  apiGatewayPath: string;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  avgLatency: number | null;
  revenue: string;
}

interface AnalyticsData {
  calls: ApiCall[];
  stats: Stats;
  perApiStats: PerApiStats[];
}

const AnalyticsDashboard = () => {
  const [selectedApi, setSelectedApi] = useState<string>("all");
  const [limit] = useState(100);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: AnalyticsData }>({
    queryKey: ["api-analytics", selectedApi, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: "0",
      });
      if (selectedApi !== "all") {
        params.append("apiEndpointId", selectedApi);
      }
      const res = await axios.get(`/api/analytics/api-calls?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const analyticsData = data?.data;
  const stats = analyticsData?.stats;
  const calls = analyticsData?.calls || [];
  const perApiStats = analyticsData?.perApiStats || [];

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-7xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-4 rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <BarChart3 className="h-10 w-10 text-primary" />
              API Analytics
            </h1>
            <p className="text-muted-foreground mt-2">Track performance and usage of your APIs</p>
          </div>

          {perApiStats.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedApi} onValueChange={setSelectedApi}>
                  <SelectTrigger className="w-[280px] rounded-xl">
                    <SelectValue placeholder="Filter by API" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All APIs</SelectItem>
                    {perApiStats.map((api) => (
                      <SelectItem key={api.apiEndpointId} value={api.apiEndpointId}>
                        {api.apiDescription || api.apiGatewayPath}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="rounded-3xl p-12 text-center border-destructive/50">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Failed to load analytics</h3>
            <p className="text-muted-foreground">Please try again later</p>
          </Card>
        ) : !stats ? (
          <Card className="rounded-3xl p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold mb-2">No data available</h3>
            <p className="text-muted-foreground">Start using your APIs to see analytics</p>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Total Calls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats.totalCalls.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-green-500/10 to-green-600/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{successRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.successCalls.toLocaleString()} / {stats.totalCalls.toLocaleString()} successful
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Avg Latency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">
                    {stats.avgLatency ? `${stats.avgLatency}ms` : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Response time</p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">
                    {formatUnits(stats.totalRevenue, 6)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">USDC earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Per-API Stats (only show when viewing all APIs) */}
            {selectedApi === "all" && perApiStats.length > 0 && (
              <Card className="rounded-3xl border-border/50 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance by API
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>API</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Total Calls</TableHead>
                        <TableHead className="text-right">Success Rate</TableHead>
                        <TableHead className="text-right">Avg Latency</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {perApiStats.map((api) => {
                        const apiSuccessRate = api.totalCalls > 0
                          ? ((api.successCalls / api.totalCalls) * 100).toFixed(1)
                          : "0";
                        return (
                          <TableRow key={api.apiEndpointId}>
                            <TableCell className="font-medium">
                              {api.apiDescription || api.apiGatewayPath}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {api.apiCategory || "Uncategorized"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {api.totalCalls.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={api.successCalls === api.totalCalls ? "text-green-500" : ""}>
                                {apiSuccessRate}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {api.avgLatency ? `${Math.round(Number(api.avgLatency))}ms` : "N/A"}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatUnits(api.revenue, 6)} USDC
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-xl"
                                onClick={() => setSelectedApi(api.apiEndpointId)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Recent API Calls */}
            <Card className="rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent API Calls
                  <Badge variant="secondary" className="ml-auto">
                    {calls.length} calls
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calls.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No API calls yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>API</TableHead>
                          <TableHead>Caller</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Latency</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              <div className="flex flex-col">
                                <span className="text-sm">{call.apiDescription || "API"}</span>
                                <span className="text-xs text-muted-foreground">{call.apiGatewayPath}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {truncateAddress(call.callerWallet)}
                            </TableCell>
                            <TableCell>
                              {call.status === "success" && (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Success
                                </Badge>
                              )}
                              {call.status === "failed" && (
                                <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              {call.status === "refunded" && (
                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Refunded
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {call.latencyMs ? `${call.latencyMs}ms` : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {formatUnits(call.priceAmount, 6)} USDC
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(call.createdAt)}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs text-red-500">
                              {call.errorMessage || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
