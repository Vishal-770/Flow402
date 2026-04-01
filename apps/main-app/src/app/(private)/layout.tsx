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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Navbar />
        <main className="flex-1 pt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
