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
  apiTags,
} from "@/src/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { headers } from "next/headers";
import { createApiEndpointSchema } from "@/src/lib/validators/api-endpoint";
import { z } from "zod";

async function getAuthUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const endpoint = await db.query.apiEndpoints.findFirst({
      where: and(eq(apiEndpoints.id, id), eq(apiEndpoints.providerId, user.id)),
      with: {
        apiUpstreamHeaders: true,
        apiQueryParams: true,
        apiRequestBodies: true,
        apiTags: true,
      },
    });

    if (!endpoint) {
      return NextResponse.json({ success: false, message: "Endpoint not found" }, { status: 404 });
    }

    // Transform tags to an array of strings
    const tags = endpoint.apiTags?.map((t: any) => t.tag) || [];

    return NextResponse.json({
      success: true,
      data: {
        ...endpoint,
        tags,
      },
    });
  } catch (error) {
    console.error("Error fetching api endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const json: unknown = await req.json();
    
    // Partially reuse the creation schema for validation
    const body = createApiEndpointSchema.partial().parse(json);

    // Verify ownership
    const existing = await db
      .select({ id: apiEndpoints.id })
      .from(apiEndpoints)
      .where(and(eq(apiEndpoints.id, id), eq(apiEndpoints.providerId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "Endpoint not found" }, { status: 404 });
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      // Update basic details
      await tx
        .update(apiEndpoints)
        .set({
          description: body.description,
          category: body.category,
          imageUrl: body.imageUrl,
          docsUrl: body.docsUrl,
          updatedAt: now,
        })
        .where(eq(apiEndpoints.id, id));

      // Synchronize Tags if provided
      if (body.tags) {
        await tx.delete(apiTags).where(eq(apiTags.apiEndpointId, id));
        const uniqueTags = Array.from(new Set(body.tags.map(t => t.trim().toLowerCase()))).filter(t => t !== "");
        if (uniqueTags.length > 0) {
          await tx.insert(apiTags).values(
            uniqueTags.map((tag) => ({
              id: uuidv4(),
              apiEndpointId: id,
              tag: tag,
              createdAt: now,
            }))
          );
        }
      }

      // Synchronize Upstream Headers if provided
      if (body.upstreamHeaders) {
        await tx.delete(apiUpstreamHeaders).where(eq(apiUpstreamHeaders.apiEndpointId, id));
        if (body.upstreamHeaders.length > 0) {
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
      }

      // Synchronize Query Params if provided
      if (body.queryParams) {
        await tx.delete(apiQueryParams).where(eq(apiQueryParams.apiEndpointId, id));
        if (body.queryParams.length > 0) {
          await tx.insert(apiQueryParams).values(
            body.queryParams.map(p => ({
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

      // Synchronize Request Bodies if provided
      if (body.requestBody) {
        await tx.delete(apiRequestBodies).where(eq(apiRequestBodies.apiEndpointId, id));
        if (body.requestBody.length > 0) {
          await tx.insert(apiRequestBodies).values(
            body.requestBody.map(b => ({
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

    return NextResponse.json({ success: true, message: "Endpoint updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid request data", errors: error.issues }, { status: 422 });
    }
    console.error("Error updating api endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
