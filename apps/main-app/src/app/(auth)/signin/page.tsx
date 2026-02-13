import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SocialLoginForm } from "@/src/components/ui/social-login-form";

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="size-4" />
        Back to Home
      </Link>
      <div className="w-full max-w-sm">
        <SocialLoginForm />
      </div>
    </div>
  );
}
