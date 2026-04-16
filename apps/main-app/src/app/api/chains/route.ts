import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import { chains } from "@/src/drizzle/schema";
import { createChainSchema } from "@/src/lib/validators/chain";
import { withAdmin } from "@/src/proxy";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// GET is public — chains are needed everywhere for display
export async function GET() {
  try {
    const allChains = await db
      .select({
        id: chains.id,
        name: chains.name,
        chainId: chains.chainId,
        imageUri: chains.imageUri,
        explorerBaseUrl: chains.explorerBaseUrl,
        createdAt: chains.createdAt,
      })
      .from(chains);

    return NextResponse.json({ success: true, data: allChains });
  } catch (error) {
    console.error("Error fetching chains:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST is admin-only
export const POST = withAdmin("create", async (req: Request) => {
  try {
    const json = await req.json();
    const body = createChainSchema.parse(json);

    const newChainId = uuidv4();

    await db.insert(chains).values({
      id: newChainId,
      name: body.name,
      chainId: body.chainId,
      explorerBaseUrl: body.explorerBaseUrl,
      imageUri: body.imageUri || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: newChainId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.issues },
        { status: 422 }
      );
    }

    console.error("Error creating chain:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});
