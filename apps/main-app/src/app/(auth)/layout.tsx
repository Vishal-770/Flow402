import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/auth-server";
import { ModeToggle } from "@/src/components/ModeToggle";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect("/");
  }

  return (
    <div className="relative min-h-svh">
      {children}
      {/* Theme toggle at bottom right */}
      <div className="fixed bottom-6 right-6">
        <ModeToggle />
      </div>
    </div>
  );
}
