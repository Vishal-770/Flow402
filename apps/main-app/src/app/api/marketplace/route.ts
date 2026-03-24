import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import {
  apiEndpoints,
  tokens,
  chains,
  user,
} from "@/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const endpoints = await db
      .select({
        id: apiEndpoints.id,
        description: apiEndpoints.description,
        docsUrl: apiEndpoints.docsUrl,
        imageUrl: apiEndpoints.imageUrl,
        sampleResponse: apiEndpoints.sampleResponse,
        walletId: apiEndpoints.walletId,
        priceAmount: apiEndpoints.priceAmount,
        tokenId: apiEndpoints.tokenId,
        providerUrl: apiEndpoints.providerUrl,
        gatewayPath: apiEndpoints.gatewayPath,
        category: apiEndpoints.category,
        isActive: apiEndpoints.isActive,
        createdAt: apiEndpoints.createdAt,
        updatedAt: apiEndpoints.updatedAt,
        tokenSymbol: tokens.symbol,
        tokenDecimals: tokens.decimals,
        chainName: chains.name,
        providerName: user.name,
        providerImage: user.image,
      })
      .from(apiEndpoints)
      .leftJoin(tokens, eq(apiEndpoints.tokenId, tokens.id))
      .leftJoin(chains, eq(tokens.chainId, chains.id))
      .leftJoin(user, eq(apiEndpoints.providerId, user.id))
      .where(eq(apiEndpoints.isActive, true));

    return NextResponse.json({ success: true, data: endpoints });
  } catch (error) {
    console.error("Error fetching marketplace endpoints:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
