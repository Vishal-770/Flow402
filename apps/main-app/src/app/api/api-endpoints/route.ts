import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import {
  apiEndpoints,
  tokens,
  chains,
  wallets,
  apiUpstreamHeaders,
  apiQueryParams,
  apiRequestBodies,
} from "@/src/drizzle/schema";
import { createApiEndpointSchema } from "@/src/lib/validators/api-endpoint";
import { auth } from "@/src/lib/auth";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { nanoid } from "nanoid";
import { headers } from "next/headers";

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
        walletAddress: wallets.address,
      })
      .from(apiEndpoints)
      .leftJoin(tokens, eq(apiEndpoints.tokenId, tokens.id))
      .leftJoin(chains, eq(tokens.chainId, chains.id))
      .leftJoin(wallets, eq(apiEndpoints.walletId, wallets.id))
      .where(eq(apiEndpoints.providerId, user.id));

    return NextResponse.json({ success: true, data: endpoints });
  } catch (error) {
    console.error("Error fetching api endpoints:", error);
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
    const body = createApiEndpointSchema.parse(json);

    // Verify the wallet belongs to this user
    const userWallet = await db
      .select({ id: wallets.id })
      .from(wallets)
      .where(and(eq(wallets.id, body.walletId), eq(wallets.userId, user.id)))
      .limit(1);

    if (userWallet.length === 0) {
      return NextResponse.json(
        { success: false, message: "Wallet not found or not owned by you" },
        { status: 403 }
      );
    }

    const newId = uuidv4();
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(apiEndpoints).values({
        id: newId,
        description: body.description || null,
        docsUrl: body.docsUrl || null,
        imageUrl: body.imageUrl || null,
        sampleResponse: body.sampleResponse || null,
        providerId: user.id,
        walletId: body.walletId,
        priceAmount: body.priceAmount,
        tokenId: body.tokenId,
        providerUrl: body.providerUrl,
        gatewayPath: body.gatewayPath || `/${nanoid(10)}`,
        category: body.category || null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      if (body.upstreamHeaders && body.upstreamHeaders.length > 0) {
        await tx.insert(apiUpstreamHeaders).values(
          body.upstreamHeaders.map((h) => ({
            id: uuidv4(),
            apiEndpointId: newId,
            headerName: h.headerName,
            headerValue: h.headerValue,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      if (body.queryParams && body.queryParams.length > 0) {
        await tx.insert(apiQueryParams).values(
          body.queryParams.map((p) => ({
            id: uuidv4(),
            apiEndpointId: newId,
            name: p.name,
            type: p.type,
            required: p.required,
            description: p.description || null,
            defaultValue: p.defaultValue || null,
            createdAt: now,
          }))
        );
      }

      if (body.requestBody && body.requestBody.length > 0) {
        await tx.insert(apiRequestBodies).values(
          body.requestBody.map((b) => ({
            id: uuidv4(),
            apiEndpointId: newId,
            fieldName: b.fieldName,
            fieldType: b.fieldType,
            required: b.required,
            description: b.description || null,
            exampleValue: b.exampleValue || null,
            createdAt: now,
          }))
        );
      }
    });

    return NextResponse.json({ success: true, id: newId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.issues },
        { status: 422 }
      );
    }

    console.error("Error creating api endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
