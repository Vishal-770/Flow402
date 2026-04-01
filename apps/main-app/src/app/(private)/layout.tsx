import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/auth-server";
import Navbar from "@/src/components/Navbar";
import Sidebar from "@/src/components/Sidebar";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="bg-background">
      <Sidebar />
      <div className="lg:pl-72 min-w-0">
        <Navbar />
        <main className="pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
