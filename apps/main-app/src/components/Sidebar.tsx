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
  Wallet,
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
  },
  {
    name: "Marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
  },
  {
    name: "My API Listings",
    href: "/api-endpoints",
    icon: Code2,
  },
  {
    name: "Tokens",
    href: "/tokens",
    icon: Coins,
  },
  {
    name: "Chains",
    href: "/chains",
    icon: Link2,
  },
  {
    name: "Wallets",
    href: "/wallets",
    icon: Wallet,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border z-40 hidden lg:flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-8 border-b border-border">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Flow402" className="h-7 w-auto" />
          <span className="text-xl font-bold tracking-tight text-foreground">
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
                  "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full" />
                )}
                <link.icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-secondary-foreground" : "text-muted-foreground/70 group-hover:text-foreground"
                )} />
                <span className="text-sm tracking-tight">{link.name}</span>
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
            className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 shadow-sm shadow-primary/10"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="font-semibold text-sm">Register API</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Resources & Help</span>
          </div>
          <Button variant="outline" className="w-full rounded-lg text-xs h-9 font-semibold bg-background border-border">
            Read Docs
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
