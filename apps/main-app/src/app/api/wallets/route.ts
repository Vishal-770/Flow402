import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import { wallets } from "@/src/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { headers } from "next/headers";

const saveWalletSchema = z.object({
  address: z.string().min(1, "Wallet address is required"),
});

async function getAuthUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userWallets = await db
      .select({
        id: wallets.id,
        address: wallets.address,
        createdAt: wallets.createdAt,
      })
      .from(wallets)
      .where(eq(wallets.userId, user.id));

    return NextResponse.json({ success: true, data: userWallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const json: unknown = await req.json();
    const body = saveWalletSchema.parse(json);

    // Check if this address already exists
    const existing = await db
      .select({ id: wallets.id })
      .from(wallets)
      .where(eq(wallets.address, body.address))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Wallet already saved",
        id: existing[0].id,
      });
    }

    const newId = uuidv4();
    const now = new Date();

    await db.insert(wallets).values({
      id: newId,
      userId: user.id,
      address: body.address,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      { success: true, id: newId },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.issues },
        { status: 422 }
      );
    }

    console.error("Error saving wallet:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
