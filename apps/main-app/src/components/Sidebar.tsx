"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
  HelpCircle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "My API Listings", href: "/api-endpoints", icon: Code2 },
  { name: "Tokens", href: "/tokens", icon: Coins },
  { name: "Chains", href: "/chains", icon: Link2 },
  { name: "Wallets", href: "/wallets", icon: Wallet },
  { name: "Profile", href: "/profile", icon: User },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border z-40 hidden lg:flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Flow402" width={28} height={28} className="h-7 w-auto dark:invert" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Flow402
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
        {/* Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Main Menu
          </p>
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 relative",
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full" />
                )}
                <link.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive
                      ? "text-accent-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="text-sm">{link.name}</span>
              </Link>
            );
          })}
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Actions
          </p>
          <Link
            href="/api-endpoints/create"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 font-medium text-sm"
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            Register API
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-3">
          <div className="flex items-center gap-2 px-1">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Resources & Help
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-lg text-xs h-8 font-medium"
          >
            Read Docs
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
