import { NextResponse } from "next/server";
import { db } from "@/src/drizzle/db";
import { apiReviews, user as userTable } from "@/src/drizzle/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { createReviewSchema } from "@/src/lib/validators/review";
import { v4 as uuidv4 } from "uuid";
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
    const { id } = await params;

    const reviews = await db
      .select({
        id: apiReviews.id,
        rating: apiReviews.rating,
        comment: apiReviews.comment,
        createdAt: apiReviews.createdAt,
        reviewerName: userTable.name,
        reviewerImage: userTable.image,
      })
      .from(apiReviews)
      .leftJoin(userTable, eq(apiReviews.reviewerId, userTable.id))
      .where(eq(apiReviews.apiEndpointId, id))
      .orderBy(desc(apiReviews.createdAt));

    // Also get stats
    const stats = await db
        .select({
            avgRating: avg(apiReviews.rating),
            totalReviews: count(apiReviews.id),
        })
        .from(apiReviews)
        .where(eq(apiReviews.apiEndpointId, id));

    return NextResponse.json({ 
        success: true, 
        data: reviews,
        stats: {
            averageRating: Number(stats[0]?.avgRating || 0),
            totalCount: Number(stats[0]?.totalReviews || 0)
        }
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const json = await req.json();
    const body = createReviewSchema.parse(json);

    // Check if user already reviewed this API
    const existingReview = await db
      .select()
      .from(apiReviews)
      .where(
        and(
          eq(apiReviews.apiEndpointId, id),
          eq(apiReviews.reviewerId, user.id)
        )
      )
      .limit(1);

    if (existingReview.length > 0) {
      return NextResponse.json(
        { success: false, message: "You have already reviewed this API" },
        { status: 400 }
      );
    }

    const newReviewId = uuidv4();
    const now = new Date();

    await db.insert(apiReviews).values({
      id: newReviewId,
      apiEndpointId: id,
      reviewerId: user.id,
      rating: body.rating,
      comment: body.comment,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, id: newReviewId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid input", errors: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
