import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import { apiEndpoints } from "@/src/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const endpoint = await db
      .select({
        providerUrl: apiEndpoints.providerUrl,
      })
      .from(apiEndpoints)
      .where(eq(apiEndpoints.id, id))
      .limit(1);

    if (endpoint.length === 0 || !endpoint[0].providerUrl) {
      return NextResponse.json(
        { success: false, message: "Endpoint not found or has no provider URL" },
        { status: 404 }
      );
    }

    const providerUrl = endpoint[0].providerUrl;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      let response;
      try {
        // Try HEAD first (lightweight)
        response = await fetch(providerUrl, {
          method: "HEAD",
          signal: controller.signal,
        });

        // Some servers return 405 Method Not Allowed for HEAD or block it
        if (!response.ok && (response.status === 405 || response.status === 403)) {
          throw new Error("HEAD failed");
        }
      } catch (err) {
        // Fallback to GET
        response = await fetch(providerUrl, {
          method: "GET",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response && response.ok) {
        return NextResponse.json({ success: true, status: "active", statusCode: response.status });
      } else {
        return NextResponse.json({ 
          success: true, 
          status: "inactive", 
          statusCode: response?.status || 0,
          message: response ? `HTTP ${response.status}` : "No response"
        });
      }
    } catch (error: any) {
      const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
      return NextResponse.json({ 
        success: true, 
        status: "error", 
        message: isTimeout ? 'Timeout' : 'Unreachable'
      });
    }
  } catch (error) {
    console.error("Error pinging API:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
