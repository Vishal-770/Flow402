"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";

const DashboardPage = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    toast.loading("Signing out...", { id: "logout" });

    // Add a small delay for smooth experience
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully", { id: "logout" });
          setTimeout(() => {
            router.push("/signin");
            router.refresh();
          }, 500);
        },
        onError: () => {
          setIsLoggingOut(false);
          toast.error("Failed to sign out", { id: "logout" });
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="text-xl font-bold text-foreground hover:text-primary transition-colors"
              >
                Better Auth
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard"
                  className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session && (
                <>
                  <span className="text-sm text-muted-foreground">
                    Welcome, {session.user.name || session.user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="ml-4"
                  >
                    {isLoggingOut ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing out...
                      </>
                    ) : (
                      "Sign Out"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-border rounded-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Welcome to your Dashboard
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                You are successfully authenticated! This is a protected page.
              </p>

              {session && (
                <div className="bg-card rounded-lg shadow-md p-6 max-w-md mx-auto border border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    User Information
                  </h2>
                  <div className="space-y-2 text-left">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Name:</span>{" "}
                      {session.user.name || "Not provided"}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Email:
                      </span>{" "}
                      {session.user.email}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Email Verified:
                      </span>{" "}
                      {session.user.emailVerified ? (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ Yes
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          ✗ No
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 space-x-4">
                <Link href="/profile">
                  <Button variant="outline">View Profile</Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
