"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Activity, ShieldCheck, ShieldAlert, Cpu } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface StatusData {
  status: string;
  database: string;
  version: string;
  timestamp: string;
}

export default function BackendStatus() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace("/gw", "") || "http://localhost:4000";
      const res = await axios.get(baseUrl, { timeout: 5000 });
      setData(res.data);
      setError(false);
    } catch (err) {
      console.error("Failed to fetch backend status:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 px-1 animate-pulse">
        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
        <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/50">
          Checking Infra...
        </span>
      </div>
    );
  }

  const isOperational = !error && data?.status === "online" && data?.database === "connected";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isOperational ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          )} />
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            isOperational ? "text-green-500" : "text-red-500"
          )}>
            {isOperational ? "Operational" : "Degraded"}
          </span>
        </div>
        {data?.version && (
          <span className="text-[9px] font-mono text-muted-foreground opacity-50">
            v{data.version}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
            <Activity className="h-3 w-3" /> API
          </div>
          <span className="text-[10px] font-black">{isOperational ? "ONLINE" : "ERROR"}</span>
        </div>
        <div className="p-2 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
            <Cpu className="h-3 w-3" /> DB
          </div>
          <span className="text-[10px] font-black">{data?.database === "connected" ? "SYNCED" : "DOWN"}</span>
        </div>
      </div>
    </div>
  );
}
