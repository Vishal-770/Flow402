import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SocialLoginForm } from "@/src/components/ui/social-login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-stretch overflow-hidden bg-background">
      {/* Left Column: Brand & Hero (50/50 Split) */}
      <div className="relative hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-20 text-white bg-zinc-950 overflow-hidden shrink-0">
        {/* Background Layer (Stationary, Professional) */}
        <div 
          className="absolute inset-0 z-0 opacity-30 bg-cover bg-center grayscale shadow-inner"
          style={{ backgroundImage: 'url("/login-hero.png")' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        {/* Top Branding Section */}
        <div className="relative z-10 flex flex-col gap-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Platform
          </Link>

          <div className="flex items-center gap-5">
            <div className="relative w-14 h-14 flex items-center justify-center p-2.5 bg-white rounded-2xl shadow-2xl">
               <Image src="/logo.png" alt="Flow402" width={40} height={40} className="object-contain" />
            </div>
            <div className="flex flex-col text-white">
              <span className="text-3xl font-bold tracking-tighter">Flow402</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50 mb-1">Infrastructure for Web3 Scale</span>
            </div>
          </div>
        </div>

        {/* Main Hero Content (Clean & High Contrast) */}
        <div className="relative z-10 max-w-xl self-start mb-20 space-y-8">
          <div className="space-y-6">
            <h2 className="text-5xl xl:text-7xl font-bold tracking-tight leading-[1.05] text-white">
              Accelerate your Web3 scale with high-performance APIs.
            </h2>
            <p className="text-xl text-white/70 leading-relaxed font-medium">
              A high-performance ecosystem where developers build, monetize, and scale with zero friction.
            </p>
          </div>
          
          <div className="h-px w-24 bg-white/20 rounded-full" />
        </div>

        {/* Subtle Footer Citation */}
        <div className="relative z-10 text-[11px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-4">
           <span>Standard Protocol V.1.0</span>
           <span className="w-1 h-1 bg-white/10 rounded-full" />
           <span>© 2026 Flow402 Networks</span>
        </div>
      </div>

      {/* Right Column: Auth Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-8 md:px-16 xl:px-24 2xl:px-48 bg-background overflow-y-auto">
        <Link
          href="/"
          className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        {/* Simple Branding for Auth Side */}
        <div className="w-full max-w-md flex flex-col items-center text-center space-y-8 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Link href="/" className="w-16 h-16 flex items-center justify-center p-3 bg-white rounded-2xl shadow-xl border border-zinc-100 hover:border-primary/20 transition-all">
             <Image src="/logo.png" alt="Flow402" width={48} height={48} className="object-contain" />
          </Link>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to Flow402</h1>
            <p className="text-sm text-muted-foreground font-medium max-w-[280px]">
              Access your institutional dashboard and manage your high-performance API ecosystem.
            </p>
          </div>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 relative z-10">
          <SocialLoginForm />
          
          <div className="pt-8 text-center space-y-8">
            <p className="px-8 text-[11px] text-muted-foreground leading-relaxed balance font-medium">
              By accessing the secure terminal, you confirm your acceptance of our{" "}
              <Link
                href="/terms"
                className="font-bold text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
              >
                Service Agreement
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-bold text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
              >
                Data Privacy Protocols
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
