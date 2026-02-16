import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import { wallets } from "@/src/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

async function getAuthUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Only delete if the wallet belongs to this user
    const existing = await db
      .select({ id: wallets.id })
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Wallet not found" },
        { status: 404 }
      );
    }

    await db
      .delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
