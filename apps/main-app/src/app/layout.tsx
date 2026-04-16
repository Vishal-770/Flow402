import type { Metadata } from "next";
import { Saira } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "@/src/components/ui/sonner";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flow402 | The Premier Web3 API Marketplace",
  description: "Powering seamless data access, historical APIs, and AI integrations to make building simpler and enable developers to ship faster.",
};

import QueryProvider from "@/src/components/query-provider";
import ThirdwebProviderWrapper from "../components/thirdweb-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${saira.className} ${saira.variable} font-sans antialiased`}
      >
        <ThirdwebProviderWrapper>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster richColors position="top-center" />
            </ThemeProvider>
          </QueryProvider>
        </ThirdwebProviderWrapper>
      </body>
    </html>
  );
}

