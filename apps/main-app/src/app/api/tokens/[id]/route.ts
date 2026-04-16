import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import { tokens } from "@/src/drizzle/schema";
import { updateTokenSchema } from "@/src/lib/validators/token";
import { withAdmin } from "@/src/proxy";
import { eq } from "drizzle-orm";
import { z } from "zod";

// PUT — admin-only
export const PUT = withAdmin("update", async (req: Request, _user, params) => {
  try {
    const { id: rawId } = await params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const json: unknown = await req.json();
    const body = updateTokenSchema.parse(json);

    const existing = await db
      .select({ id: tokens.id })
      .from(tokens)
      .where(eq(tokens.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Token not found" },
        { status: 404 }
      );
    }

    await db
      .update(tokens)
      .set({
        ...(body.symbol !== undefined && { symbol: body.symbol }),
        ...(body.name !== undefined && { name: body.name || null }),
        ...(body.chainId !== undefined && { chainId: body.chainId }),
        ...(body.contractAddress !== undefined && { contractAddress: body.contractAddress }),
        ...(body.decimals !== undefined && { decimals: body.decimals }),
        ...(body.explorerTokenUrl !== undefined && { explorerTokenUrl: body.explorerTokenUrl || null }),
        ...(body.imageUri !== undefined && { imageUri: body.imageUri || null }),
      })
      .where(eq(tokens.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.issues },
        { status: 422 }
      );
    }

    console.error("Error updating token:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});

// DELETE — admin-only
export const DELETE = withAdmin("delete", async (_req: Request, _user, params) => {
  try {
    const { id: rawId } = await params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const existing = await db
      .select({ id: tokens.id })
      .from(tokens)
      .where(eq(tokens.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Token not found" },
        { status: 404 }
      );
    }

    await db.delete(tokens).where(eq(tokens.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting token:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});
