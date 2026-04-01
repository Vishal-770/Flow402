import React from "react";
import Navbar from "@/src/components/Navbar";

const PublicPageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
};

export default PublicPageLayout;
