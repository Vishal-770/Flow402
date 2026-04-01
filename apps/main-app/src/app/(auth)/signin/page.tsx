import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SocialLoginForm } from "@/src/components/ui/social-login-form";
import { Separator } from "@/src/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-stretch overflow-hidden bg-background">
      {/* Left Column — Brand Hero Panel */}
      <div className="relative hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-16 text-white bg-zinc-950 overflow-hidden shrink-0">
        {/* Background hero image */}
        <div
          className="absolute inset-0 z-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: 'url("/login-hero.png")' }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />

        {/* Top nav */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white/90 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Platform
          </Link>
        </div>

        {/* Branding */}
        <div className="relative z-10 max-w-lg space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center p-2 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
              <Image
                src="/logo.png"
                alt="Flow402"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight block">
                Flow402
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                Infrastructure for Web3
              </span>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1] text-white">
            Accelerate your Web3 scale with high-performance APIs.
          </h2>

          <p className="text-white/60 leading-relaxed font-medium">
            A high-performance ecosystem where developers build, monetize, and
            scale with zero friction.
          </p>

          <div className="h-px w-16 bg-white/20" />
        </div>

        {/* Footer citation */}
        <div className="relative z-10 text-[10px] font-bold text-white/25 uppercase tracking-widest flex items-center gap-3">
          <span>Standard Protocol V.1.0</span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span>© 2026 Flow402 Networks</span>
        </div>
      </div>

      {/* Right Column — Auth Form */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-8 md:px-16 xl:px-20 bg-background overflow-y-auto">
        <Link
          href="/"
          className="lg:hidden absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <div className="w-full max-w-sm space-y-8">
          {/* Logo mark */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Link
              href="/"
              className="w-14 h-14 flex items-center justify-center p-3 bg-card rounded-xl border border-border hover:border-primary/40 transition-colors"
            >
              <Image
                src="/logo.png"
                alt="Flow402"
                width={40}
                height={40}
                className="object-contain"
              />
            </Link>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome to Flow402
              </h1>
              <p className="text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                Sign in to access your dashboard and manage your API ecosystem.
              </p>
            </div>
          </div>

          {/* OAuth providers */}
          <SocialLoginForm />

          {/* Legal */}
          <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="font-semibold text-foreground hover:text-primary underline underline-offset-4 transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-foreground hover:text-primary underline underline-offset-4 transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
