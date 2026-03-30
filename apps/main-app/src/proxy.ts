import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";
import { headers } from "next/headers";

/**
 * Validates the current session and returns the user.
 * For use in API routes and Server Components.
 */
export async function getAuthUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

/**
 * Higher-order function to protect API routes.
 * Handles session checking and provides the user object to the handler.
 */
export function withAuth(handler: (req: Request, user: any, params: any) => Promise<NextResponse>) {
  return async (req: Request, { params }: { params: any }) => {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return handler(req, user, params);
  };
}

/**
 * Next.js 16 Proxy / Middleware logic.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith("/api/api-endpoints") || 
                     pathname.startsWith("/api/marketplace/favorites") ||
                     pathname.startsWith("/api/analytics");
  
  const isPrivateRoute = pathname.startsWith("/dashboard") || 
                         pathname.startsWith("/api-endpoints") || 
                         pathname.startsWith("/marketplace") ||
                         pathname.startsWith("/profile");

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Use headers from the request for middle-ware session checking
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (isPrivateRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api-endpoints/:path*",
    "/marketplace/:path*",
    "/profile/:path*",
    "/api/api-endpoints/:path*",
    "/api/marketplace/favorites/:path*",
    "/api/analytics/:path*",
  ],
};
