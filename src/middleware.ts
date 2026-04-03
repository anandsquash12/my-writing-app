import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/create", "/profile", "/dashboard", "/my-drafts"];

function isProtectedPath(pathname: string): boolean {
  const isEditPath = /^\/posts\/[^/]+\/edit\/?$/.test(pathname);
  if (isEditPath) {
    return true;
  }
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("mw-auth")?.value;
  if (authCookie !== "1") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "auth");
    return NextResponse.redirect(loginUrl);
  }

  const verifiedCookie = request.cookies.get("mw-verified")?.value;
  if (verifiedCookie !== "1") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "verify");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/create/:path*", "/profile/:path*", "/dashboard/:path*", "/my-drafts/:path*", "/posts/:path*/edit"],
};
