import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import { favorites } from "@/src/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

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
      return NextResponse.json({ success: true, data: [] });
    }

    const userFavorites = await db
      .select({
        apiEndpointId: favorites.apiEndpointId,
      })
      .from(favorites)
      .where(eq(favorites.userId, user.id));

    return NextResponse.json({ 
      success: true, 
      data: userFavorites.map(f => f.apiEndpointId) 
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
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

    const { apiEndpointId } = await req.json();
    if (!apiEndpointId) {
      return NextResponse.json(
        { success: false, message: "API Endpoint ID is required" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, user.id),
          eq(favorites.apiEndpointId, apiEndpointId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Unfavorite
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, user.id),
            eq(favorites.apiEndpointId, apiEndpointId)
          )
        );
      return NextResponse.json({ success: true, action: "removed" });
    } else {
      // Favorite
      const id = uuidv4();
      const now = new Date();
      await db.insert(favorites).values({
        id,
        userId: user.id,
        apiEndpointId,
        createdAt: now,
        updatedAt: now,
      });
      return NextResponse.json({ success: true, action: "added" });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
