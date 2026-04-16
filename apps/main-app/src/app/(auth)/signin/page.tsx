import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SocialLoginForm } from "@/src/components/ui/social-login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-stretch overflow-hidden bg-background">
      {/* Left Column — Brand Hero Panel */}
      <div className="relative hidden lg:flex flex-col justify-between w-1/2 p-20 xl:p-24 text-white bg-zinc-950 overflow-hidden shrink-0 border-r border-white/5">
        {/* Subtle grid pattern instead of gradient/image */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Top nav */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/90 transition-colors group"
          >
            <ArrowLeft className="size-3 group-hover:-translate-x-1 transition-transform" />
            Back to Platform
          </Link>
        </div>

        {/* Branding */}
        <div className="relative z-10 max-w-lg space-y-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl">
              <Image
                src="/logo.png"
                alt="Flow402"
                width={40}
                height={40}
                className="object-contain invert"
              />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-extrabold tracking-tighter block uppercase">
                Flow402
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                Core Protocol
              </span>
            </div>
          </div>

          <h2 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1] text-white">
            Monetize <br /> Infrastructure.
          </h2>

          <p className="text-white/50 text-lg leading-relaxed font-medium">
            Advanced developer portal for high-performance API distribution and real-time revenue settlement on Sepolia.
          </p>
        </div>

        {/* Footer citation */}
        <div className="relative z-10 text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] flex items-center gap-4">
          <span>Auth Service 1.0</span>
          <div className="h-px w-8 bg-white/5" />
          <span>© 2026 Registry</span>
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

        <div className="w-full max-w-sm space-y-12">
          {/* Logo mark */}
          <div className="flex flex-col items-center text-center space-y-6">
            <Link
              href="/"
              className="w-16 h-16 flex items-center justify-center p-4 bg-muted/30 rounded-2xl border border-border hover:border-primary/40 transition-all shadow-sm"
            >
              <Image
                src="/logo.png"
                alt="Flow402"
                width={48}
                height={48}
                className="object-contain dark:invert"
              />
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Log in to your terminal to manage <br /> assets and endpoints.
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
