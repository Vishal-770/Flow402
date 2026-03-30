import { NextResponse } from "next/server";
import { withAuth } from "@/src/proxy";
import { db } from "@/src/drizzle/db";
import * as schema from "@/src/drizzle/schema";
import { eq, desc, and, sql, count, avg, sum } from "drizzle-orm";

export const GET = withAuth(async (req: Request, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const apiEndpointId = searchParams.get("apiEndpointId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // First verify the user owns the API endpoint if filtered by specific API
    if (apiEndpointId) {
      const endpoint = await db.query.apiEndpoints.findFirst({
        where: eq(schema.apiEndpoints.id, apiEndpointId),
      });

      if (!endpoint || endpoint.providerId !== user.id) {
        return NextResponse.json(
          { success: false, message: "Unauthorized - You don't own this API" },
          { status: 403 }
        );
      }
    }

    // Build query to get all API calls for user's APIs
    const baseCondition = apiEndpointId
      ? eq(schema.apiCalls.apiEndpointId, apiEndpointId)
      : undefined;

    // Get API calls with endpoint details
    const calls = await db
      .select({
        id: schema.apiCalls.id,
        apiEndpointId: schema.apiCalls.apiEndpointId,
        callerWallet: schema.apiCalls.callerWallet,
        priceAmount: schema.apiCalls.priceAmount,
        status: schema.apiCalls.status,
        errorMessage: schema.apiCalls.errorMessage,
        latencyMs: schema.apiCalls.latencyMs,
        createdAt: schema.apiCalls.createdAt,
        apiDescription: schema.apiEndpoints.description,
        apiCategory: schema.apiEndpoints.category,
        apiGatewayPath: schema.apiEndpoints.gatewayPath,
      })
      .from(schema.apiCalls)
      .innerJoin(
        schema.apiEndpoints,
        eq(schema.apiCalls.apiEndpointId, schema.apiEndpoints.id)
      )
      .where(
        and(
          eq(schema.apiEndpoints.providerId, user.id),
          baseCondition
        )
      )
      .orderBy(desc(schema.apiCalls.createdAt))
      .limit(limit)
      .offset(offset);

    // Get summary statistics
    const statsQuery = await db
      .select({
        totalCalls: count(),
        successCalls: sql<number>`COUNT(CASE WHEN ${schema.apiCalls.status} = 'success' THEN 1 END)`,
        failedCalls: sql<number>`COUNT(CASE WHEN ${schema.apiCalls.status} = 'failed' THEN 1 END)`,
        refundedCalls: sql<number>`COUNT(CASE WHEN ${schema.apiCalls.status} = 'refunded' THEN 1 END)`,
        avgLatency: avg(schema.apiCalls.latencyMs),
        totalRevenue: sql<string>`SUM(CAST(${schema.apiCalls.priceAmount} AS NUMERIC))`,
      })
      .from(schema.apiCalls)
      .innerJoin(
        schema.apiEndpoints,
        eq(schema.apiCalls.apiEndpointId, schema.apiEndpoints.id)
      )
      .where(
        and(
          eq(schema.apiEndpoints.providerId, user.id),
          baseCondition
        )
      );

    const stats = statsQuery[0] || {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      refundedCalls: 0,
      avgLatency: null,
      totalRevenue: "0",
    };

    // Get per-API statistics if not filtered by specific API
    let perApiStats: any[] = [];
    if (!apiEndpointId) {
      perApiStats = await db
        .select({
          apiEndpointId: schema.apiCalls.apiEndpointId,
          apiDescription: schema.apiEndpoints.description,
          apiCategory: schema.apiEndpoints.category,
          apiGatewayPath: schema.apiEndpoints.gatewayPath,
          totalCalls: count(),
          successCalls: sql<number>`COUNT(CASE WHEN ${schema.apiCalls.status} = 'success' THEN 1 END)`,
          failedCalls: sql<number>`COUNT(CASE WHEN ${schema.apiCalls.status} = 'failed' THEN 1 END)`,
          avgLatency: avg(schema.apiCalls.latencyMs),
          revenue: sql<string>`SUM(CAST(${schema.apiCalls.priceAmount} AS NUMERIC))`,
        })
        .from(schema.apiCalls)
        .innerJoin(
          schema.apiEndpoints,
          eq(schema.apiCalls.apiEndpointId, schema.apiEndpoints.id)
        )
        .where(eq(schema.apiEndpoints.providerId, user.id))
        .groupBy(
          schema.apiCalls.apiEndpointId,
          schema.apiEndpoints.description,
          schema.apiEndpoints.category,
          schema.apiEndpoints.gatewayPath
        )
        .orderBy(desc(count()));
    }

    return NextResponse.json({
      success: true,
      data: {
        calls,
        stats: {
          ...stats,
          avgLatency: stats.avgLatency ? Math.round(Number(stats.avgLatency)) : null,
          totalRevenue: stats.totalRevenue || "0",
        },
        perApiStats,
      },
    });
  } catch (error) {
    console.error("Error fetching API calls:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch API calls" },
      { status: 500 }
    );
  }
});
