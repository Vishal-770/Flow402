"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Code2,
  PlusCircle,
  Coins,
  Link2,
  User,
  ChevronRight,
  LogOut,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";

const navLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & summary",
  },
  {
    name: "Marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
    description: "Discover API endpoints",
  },
  {
    name: "My API Listings",
    href: "/api-endpoints",
    icon: Code2,
    description: "Manage your endpoints",
  },
  {
    name: "Tokens",
    href: "/tokens",
    icon: Coins,
    description: "Manage assets",
  },
  {
    name: "Chains",
    href: "/chains",
    icon: Link2,
    description: "Network configurations",
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    description: "Account settings",
  },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border z-40 hidden lg:flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-8 border-b border-border">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            F
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Flow402
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {/* Navigation */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
            Main Menu
          </p>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
                )}
                <link.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
                )} />
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none">{link.name}</span>
                  <span className="text-[10px] font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                    {link.description}
                  </span>
                </div>
                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Shortcuts */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
            Actions
          </p>
          <Link
            href="/api-endpoints/create"
            className="group flex items-center gap-3 px-4 py-4 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-12">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-none">Register API</span>
              <span className="text-[10px] font-medium opacity-80">List new endpoint</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="p-4 rounded-3xl bg-muted/30 border border-border/50 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">Need help?</span>
          </div>
          <Button variant="outline" className="w-full rounded-xl text-xs h-9">
            Read Docs
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
