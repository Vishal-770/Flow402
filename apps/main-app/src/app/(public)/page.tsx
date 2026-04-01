import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Code2,
  Layers,
  Coins,
  ShoppingBag,
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pb-28 px-6">
        {/* Subtle ambient background — using CSS vars, no hardcoded colors */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[140px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8">
            <Zap className="w-3 h-3" />
            <span>The Future of Web3 APIs</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.05]">
            Monetize and Consume{" "}
            <span className="text-primary">Programmable APIs</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Flow402 is a decentralized API marketplace that empowers developers
            to list, monetize, and integrate APIs with seamless crypto-native
            payments and high-performance gateways.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signin">
              <Button size="lg" className="px-8 py-6 text-base rounded-xl group">
                Get Started for Free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-base rounded-xl"
              >
                <ShoppingBag className="mr-2 w-4 h-4" />
                Explore Marketplace
              </Button>
            </Link>
          </div>

          {/* Stats / Social Proof */}
          <div className="mt-20 pt-12 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: "10k+", label: "API Calls/Day" },
                { value: "500+", label: "Active Providers" },
                { value: "50+", label: "Supported Chains" },
                { value: "0.1s", label: "Avg. Latency" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Everything you need to scale
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              A complete infrastructure for building, listing, and scaling your
              API business on-chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-5 h-5 text-primary" />}
              title="Secure Authentication"
              description="Enterprise-grade auth with Privy integration for seamless wallet-based sign-ins."
            />
            <FeatureCard
              icon={<Globe className="w-5 h-5 text-primary" />}
              title="Global Gateway"
              description="High-performance edge nodes ensuring your API is accessible with minimum latency worldwide."
            />
            <FeatureCard
              icon={<Coins className="w-5 h-5 text-primary" />}
              title="On-Chain Payments"
              description="Automatic revenue splitting and instant payouts in your favourite native tokens."
            />
            <FeatureCard
              icon={<Code2 className="w-5 h-5 text-primary" />}
              title="Developer First"
              description="Simple SDKs and comprehensive documentation to get you up and running in minutes."
            />
            <FeatureCard
              icon={<Layers className="w-5 h-5 text-primary" />}
              title="Multi-Chain Support"
              description="Deploy and manage APIs across Ethereum, Polygon, Arbitrum, and more."
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5 text-primary" />}
              title="Real-time Analytics"
              description="Deep insights into your API usage, performance metrics, and revenue growth."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto border border-border rounded-2xl bg-card overflow-hidden">
          <div className="p-10 md:p-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8">
              <Zap className="w-3 h-3" />
              <span>Ready to launch?</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Start building on Flow402
            </h2>
            <p className="text-muted-foreground md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join hundreds of developers who are already building the next
              generation of web3 applications on Flow402.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signin">
                <Button size="lg" className="px-10 py-6 text-base rounded-xl font-semibold">
                  Create Account
                </Button>
              </Link>
              <Link href="/api-endpoints/create">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-10 py-6 text-base rounded-xl font-semibold"
                >
                  List your API
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center font-bold text-background text-[10px]">
              F
            </div>
            <span className="font-bold tracking-tight text-foreground">
              Flow402
            </span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Flow402. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="bg-card border border-border p-8 rounded-xl hover:border-primary/40 transition-colors group">
    <div className="mb-5 p-2.5 bg-muted w-fit rounded-lg group-hover:bg-primary/10 transition-colors">
      {icon}
    </div>
    <h3 className="text-base font-bold mb-2 text-card-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">
      {description}
    </p>
  </div>
);

export default LandingPage;
