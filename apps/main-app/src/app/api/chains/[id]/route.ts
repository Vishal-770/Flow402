import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import { chains } from "@/src/drizzle/schema";
import { updateChainSchema } from "@/src/lib/validators/chain";
import { eq } from "drizzle-orm";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const json: unknown = await req.json();
    const body = updateChainSchema.parse(json);

    const existing = await db
      .select({ id: chains.id })
      .from(chains)
      .where(eq(chains.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Chain not found" },
        { status: 404 }
      );
    }

    await db
      .update(chains)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.chainId !== undefined && { chainId: body.chainId }),
        ...(body.explorerBaseUrl !== undefined && { explorerBaseUrl: body.explorerBaseUrl }),
        ...(body.imageUri !== undefined && { imageUri: body.imageUri || null }),
      })
      .where(eq(chains.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.issues },
        { status: 422 }
      );
    }

    console.error("Error updating chain:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await db
      .select({ id: chains.id })
      .from(chains)
      .where(eq(chains.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Chain not found" },
        { status: 404 }
      );
    }

    await db.delete(chains).where(eq(chains.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chain:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
