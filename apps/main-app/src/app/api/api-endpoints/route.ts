import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import {
  apiEndpoints,
  tokens,
  chains,
  wallets,
  apiTags,
  apiUpstreamHeaders,
  apiQueryParams,
  apiRequestBodies
} from "@/src/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { withAuth } from "@/src/proxy";
import { createApiEndpointSchema } from "@/src/lib/validators/api-endpoint";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

/**
 * GET: Lists all endpoints owned by the current user.
 */
export const GET = withAuth(async (req, user) => {
  try {
    const data = await db
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
        walletAddress: wallets.address,
      })
      .from(apiEndpoints)
      .leftJoin(tokens, eq(apiEndpoints.tokenId, tokens.id))
      .leftJoin(chains, eq(tokens.chainId, chains.id))
      .leftJoin(wallets, eq(apiEndpoints.walletId, wallets.id))
      .where(eq(apiEndpoints.providerId, user.id))
      .orderBy(desc(apiEndpoints.createdAt));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[API_ENDPOINTS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});

/**
 * POST: Registers a new API endpoint.
 */
export const POST = withAuth(async (req, user) => {
  try {
    const json = await req.json();
    const body = createApiEndpointSchema.parse(json);

    // Normalize: strip leading slash if present, so we store it clean
    let gatewayPath = body.gatewayPath?.replace(/^\//, "");
    if (!gatewayPath) {
      gatewayPath = uuidv4().split("-")[0];
    }

    // Check for path collisions
    const existing = await db.query.apiEndpoints.findFirst({
        where: eq(apiEndpoints.gatewayPath, gatewayPath)
    });

    if (existing) {
        return NextResponse.json({
            success: false,
            message: "Gateway path already exists. Please choose another or leave empty for auto-generation."
        }, { status: 409 });
    }

    const id = uuidv4();
    const now = new Date();

    await db.transaction(async (tx) => {
      // 1. Insert main endpoint
      await tx.insert(apiEndpoints).values({
        id,
        providerId: user.id,
        description: body.description,
        docsUrl: body.docsUrl,
        imageUrl: body.imageUrl,
        sampleResponse: body.sampleResponse,
        walletId: body.walletId,
        priceAmount: body.priceAmount,
        tokenId: body.tokenId,
        providerUrl: body.providerUrl,
        gatewayPath,
        category: body.category,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      // 2. Insert Tags
      if (body.tags && body.tags.length > 0) {
        const uniqueTags = Array.from(new Set(body.tags.map(t => t.trim().toLowerCase()))).filter(t => t !== "");
        if (uniqueTags.length > 0) {
            await tx.insert(apiTags).values(
                uniqueTags.map(tag => ({
                  id: uuidv4(),
                  apiEndpointId: id,
                  tag,
                  createdAt: now,
                }))
              );
        }
      }

      // 3. Insert Upstream Headers
      if (body.upstreamHeaders && body.upstreamHeaders.length > 0) {
        await tx.insert(apiUpstreamHeaders).values(
          body.upstreamHeaders.map(h => ({
            id: uuidv4(),
            apiEndpointId: id,
            headerName: h.headerName,
            headerValue: h.headerValue,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      // 4. Insert Query Params
      if (body.queryParams && body.queryParams.length > 0) {
        await tx.insert(apiQueryParams).values(
          body.queryParams.map(p => ({
            id: uuidv4(),
            apiEndpointId: id,
            name: p.name,
            type: p.type,
            required: p.required,
            description: p.description,
            defaultValue: p.defaultValue,
            createdAt: now,
          }))
        );
      }

      // 5. Insert Request Body Fields
      if (body.requestBody && body.requestBody.length > 0) {
        await tx.insert(apiRequestBodies).values(
          body.requestBody.map(b => ({
            id: uuidv4(),
            apiEndpointId: id,
            fieldName: b.fieldName,
            fieldType: b.fieldType,
            required: b.required,
            description: b.description,
            exampleValue: b.exampleValue,
            createdAt: now,
          }))
        );
      }
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    console.error("[API_ENDPOINTS_POST]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
});
