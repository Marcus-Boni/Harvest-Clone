import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  const response = await fetch(
    new URL("/api/auth/get-session", request.nextUrl.origin),
    {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  const session = response.ok ? await response.json() : null;

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  if (!session) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    // Redirect to login if trying to access protected routes
    if (isDashboardPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If already authenticated and trying to access login, redirect to dashboard
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
