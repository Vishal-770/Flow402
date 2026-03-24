import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import {
  apiEndpoints,
  tokens,
  chains,
  user,
  apiUpstreamHeaders,
  apiQueryParams,
  apiRequestBodies,
} from "@/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const endpoint = await db
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
        chainId: chains.id,
        providerName: user.name,
        providerImage: user.image,
      })
      .from(apiEndpoints)
      .leftJoin(tokens, eq(apiEndpoints.tokenId, tokens.id))
      .leftJoin(chains, eq(tokens.chainId, chains.id))
      .leftJoin(user, eq(apiEndpoints.providerId, user.id))
      .where(and(eq(apiEndpoints.id, id), eq(apiEndpoints.isActive, true)))
      .limit(1);

    if (endpoint.length === 0) {
      return NextResponse.json(
        { success: false, message: "Endpoint not found" },
        { status: 404 }
      );
    }

    const [
      upstreamHeaders,
      queryParams,
      requestBody,
    ] = await Promise.all([
      db
        .select({
          headerName: apiUpstreamHeaders.headerName,
          headerValue: apiUpstreamHeaders.headerValue,
        })
        .from(apiUpstreamHeaders)
        .where(eq(apiUpstreamHeaders.apiEndpointId, id)),
      db
        .select({
          name: apiQueryParams.name,
          type: apiQueryParams.type,
          required: apiQueryParams.required,
          description: apiQueryParams.description,
          defaultValue: apiQueryParams.defaultValue,
        })
        .from(apiQueryParams)
        .where(eq(apiQueryParams.apiEndpointId, id)),
      db
        .select({
          fieldName: apiRequestBodies.fieldName,
          fieldType: apiRequestBodies.fieldType,
          required: apiRequestBodies.required,
          description: apiRequestBodies.description,
          exampleValue: apiRequestBodies.exampleValue,
        })
        .from(apiRequestBodies)
        .where(eq(apiRequestBodies.apiEndpointId, id)),
    ]);

    return NextResponse.json({ 
      success: true, 
      data: {
        ...endpoint[0],
        upstreamHeaders,
        queryParams,
        requestBody,
      } 
    });
  } catch (error) {
    console.error("Error fetching marketplace endpoint detail:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
