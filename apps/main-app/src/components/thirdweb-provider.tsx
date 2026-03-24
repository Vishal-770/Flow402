"use client";

import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";

const clientId = process.env.NEXT_PUBLIC_THIRD_WEB_CLIENT_ID;

if (!clientId) {
  throw new Error("No client id provided. Please set NEXT_PUBLIC_THIRD_WEB_CLIENT_ID in your .env file.");
}

export const client = createThirdwebClient({
  clientId: clientId,
});

export default function ThirdwebProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}
