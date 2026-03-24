import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  Globe, 
  Code2, 
  Layers, 
  Coins 
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-24 md:pb-24 px-6">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 animate-fade-in">
            <Zap className="w-3 h-3" />
            <span>The Future of Web3 APIs</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Monetize and Consume <br />
            <span className="text-primary">Programmable APIs</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Flow402 is a decentralized API marketplace that empowers developers to list, 
            monetize, and integrate APIs with seamless crypto-native payments and 
            high-performance gateways.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/signin">
              <Button size="lg" className="px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/20 group">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-xl border-2">
                Explore Marketplace
              </Button>
            </Link>
          </div>

          {/* Stats/Social Proof */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-12 border-t border-border/50">
            <div>
              <div className="text-3xl font-bold">10k+</div>
              <div className="text-sm text-muted-foreground">API Calls/Day</div>
            </div>
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-muted-foreground">Active Providers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">50+</div>
              <div className="text-sm text-muted-foreground">Supported Chains</div>
            </div>
            <div>
              <div className="text-3xl font-bold">0.1s</div>
              <div className="text-sm text-muted-foreground">Avg. Latency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to scale</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete infrastructure for building, listing, and scaling your API business on-chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-primary" />}
              title="Secure Authentication"
              description="Enterprise-grade auth with Privy integration for seamless wallet-based sign-ins."
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-blue-500" />}
              title="Global Gateway"
              description="High-performance edge nodes ensuring your API is accessible with minimum latency worldwide."
            />
            <FeatureCard 
              icon={<Coins className="w-8 h-8 text-amber-500" />}
              title="On-Chain Payments"
              description="Automatic revenue splitting and instant payouts in your favorite native tokens."
            />
            <FeatureCard 
              icon={<Code2 className="w-8 h-8 text-emerald-500" />}
              title="Developer First"
              description="Simple SDKs and comprehensive documentation to get you up and running in minutes."
            />
            <FeatureCard 
              icon={<Layers className="w-8 h-8 text-purple-500" />}
              title="Multi-Chain Support"
              description="Deploy and manage APIs across Ethereum, Polygon, Arbitrum, and more."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-red-500" />}
              title="Real-time Analytics"
              description="Deep insights into your API usage, performance metrics, and revenue growth."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-primary rounded-[2rem] p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to skyrocket your API?</h2>
            <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Join hundreds of developers who are already building the next generation of 
              web3 applications on Flow402.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/signin">
                <Button size="lg" variant="secondary" className="px-10 py-7 text-lg rounded-xl font-bold hover:scale-105 transition-transform bg-white text-primary hover:bg-white/90">
                  Create Account
                </Button>
              </Link>
              <Link href="/api-endpoints/create">
                <Button size="lg" variant="outline" className="px-10 py-7 text-lg rounded-xl border-white/40 text-white hover:bg-white/10 transition-colors backdrop-blur-sm">
                  List your API
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border font-medium text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 h-full flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center space-x-2 grayscale opacity-70">
             <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center font-bold text-background text-[10px]">
              F
            </div>
            <span className="font-bold tracking-tight text-foreground">Flow402</span>
          </div>
          <div className="flex space-x-8 text-sm">
            <Link href="/" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-primary transition-colors">Docs</Link>
            <Link href="/" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <p className="text-sm opacity-60">
            © {new Date().getFullYear()} Flow402. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-background border border-border/50 p-8 rounded-2xl hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 group">
    <div className="mb-6 p-3 bg-muted w-fit rounded-xl group-hover:bg-primary/5 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">
      {description}
    </p>
  </div>
);

export default LandingPage;
