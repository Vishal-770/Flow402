import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import { tokens, chains } from "@/src/drizzle/schema";
import { createTokenSchema } from "@/src/lib/validators/token";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allTokens = await db
      .select({
        id: tokens.id,
        symbol: tokens.symbol,
        name: tokens.name,
        imageUri: tokens.imageUri,
        chainId: tokens.chainId,
        contractAddress: tokens.contractAddress,
        decimals: tokens.decimals,
        explorerTokenUrl: tokens.explorerTokenUrl,
        createdAt: tokens.createdAt,
        chainName: chains.name,
      })
      .from(tokens)
      .leftJoin(chains, eq(tokens.chainId, chains.id));

    return NextResponse.json({ success: true, data: allTokens });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json();
    const body = createTokenSchema.parse(json);

    const newTokenId = uuidv4();

    await db.insert(tokens).values({
      id: newTokenId,
      symbol: body.symbol,
      name: body.name || null,
      chainId: body.chainId,
      contractAddress: body.contractAddress,
      decimals: body.decimals,
      explorerTokenUrl: body.explorerTokenUrl || null,
      imageUri: body.imageUri || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: newTokenId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.issues },
        { status: 422 }
      );
    }

    console.error("Error creating token:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
