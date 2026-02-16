import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import {
  apiEndpoints,
  wallets,
  apiUpstreamHeaders,
  apiQueryParams,
  apiRequestBodies,
} from "@/src/drizzle/schema";
import { updateApiEndpointSchema } from "@/src/lib/validators/api-endpoint";
import { auth } from "@/src/lib/auth";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { headers } from "next/headers";

async function getAuthUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

export async function GET(
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

    const [endpoint] = await db
      .select()
      .from(apiEndpoints)
      .where(and(eq(apiEndpoints.id, id), eq(apiEndpoints.providerId, user.id)))
      .limit(1);

    if (!endpoint) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    const [headers, queryParams, requestBody] = await Promise.all([
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
        ...endpoint,
        upstreamHeaders: headers,
        queryParams: queryParams,
        requestBody: requestBody,
      },
    });
  } catch (error) {
    console.error("Error fetching api endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
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
    const json: unknown = await req.json();
    const body = updateApiEndpointSchema.parse(json);

    // Check ownership
    const existing = await db
      .select({ id: apiEndpoints.id })
      .from(apiEndpoints)
      .where(and(eq(apiEndpoints.id, id), eq(apiEndpoints.providerId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    // If walletId is being changed, verify ownership
    if (body.walletId) {
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
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.docsUrl !== undefined) updateData.docsUrl = body.docsUrl || null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    if (body.sampleResponse !== undefined) updateData.sampleResponse = body.sampleResponse || null;
    if (body.walletId !== undefined) updateData.walletId = body.walletId;
    if (body.priceAmount !== undefined) updateData.priceAmount = body.priceAmount;
    if (body.tokenId !== undefined) updateData.tokenId = body.tokenId;
    if (body.providerUrl !== undefined) updateData.providerUrl = body.providerUrl;
    if (body.gatewayPath !== undefined) updateData.gatewayPath = body.gatewayPath;
    if (body.category !== undefined) updateData.category = body.category || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(apiEndpoints)
        .set(updateData)
        .where(eq(apiEndpoints.id, id));

      // Update upstream headers if provided
      if (body.upstreamHeaders !== undefined) {
        await tx
          .delete(apiUpstreamHeaders)
          .where(eq(apiUpstreamHeaders.apiEndpointId, id));

        if (body.upstreamHeaders && body.upstreamHeaders.length > 0) {
          await tx.insert(apiUpstreamHeaders).values(
            body.upstreamHeaders.map((h) => ({
              id: uuidv4(),
              apiEndpointId: id,
              headerName: h.headerName,
              headerValue: h.headerValue,
              createdAt: now,
              updatedAt: now,
            }))
          );
        }
      }

      // Update query params if provided
      if (body.queryParams !== undefined) {
        await tx
          .delete(apiQueryParams)
          .where(eq(apiQueryParams.apiEndpointId, id));

        if (body.queryParams && body.queryParams.length > 0) {
          await tx.insert(apiQueryParams).values(
            body.queryParams.map((p) => ({
              id: uuidv4(),
              apiEndpointId: id,
              name: p.name,
              type: p.type,
              required: p.required,
              description: p.description || null,
              defaultValue: p.defaultValue || null,
              createdAt: now,
            }))
          );
        }
      }

      // Update request body fields if provided
      if (body.requestBody !== undefined) {
        await tx
          .delete(apiRequestBodies)
          .where(eq(apiRequestBodies.apiEndpointId, id));

        if (body.requestBody && body.requestBody.length > 0) {
          await tx.insert(apiRequestBodies).values(
            body.requestBody.map((b) => ({
              id: uuidv4(),
              apiEndpointId: id,
              fieldName: b.fieldName,
              fieldType: b.fieldType,
              required: b.required,
              description: b.description || null,
              exampleValue: b.exampleValue || null,
              createdAt: now,
            }))
          );
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.issues },
        { status: 422 }
      );
    }

    console.error("Error updating api endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
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

    const existing = await db
      .select({ id: apiEndpoints.id })
      .from(apiEndpoints)
      .where(and(eq(apiEndpoints.id, id), eq(apiEndpoints.providerId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    await db.transaction(async (tx) => {
      // Manual delete cascade
      await tx
        .delete(apiUpstreamHeaders)
        .where(eq(apiUpstreamHeaders.apiEndpointId, id));
      await tx
        .delete(apiQueryParams)
        .where(eq(apiQueryParams.apiEndpointId, id));
      await tx
        .delete(apiRequestBodies)
        .where(eq(apiRequestBodies.apiEndpointId, id));

      await tx.delete(apiEndpoints).where(eq(apiEndpoints.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting api endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
