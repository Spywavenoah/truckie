import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const publicRoutes = [
  "/",
  "/about",
  "/services",
  "/listings",
  "/materials",
  "/contact",
  "/faq",
  "/blog",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/verify-email",
  "/auth/2fa",
  "/api/auth",
  "/api/webhooks",
  "/api/assets",
  "/api/test-db-public",
  "/_next",
  "/images",
];

const adminRoutes = ["/admin"];
const ownerRoutes = ["/dashboard/owner"];
const clientRoutes = ["/dashboard/client"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const session = await auth();
  const isAuthenticated = !!session?.user;

  if (!isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  const isOwnerListingRoute = pathname.startsWith("/dashboard/owner/listings");
  const isClientShopRoute = pathname.startsWith("/dashboard/client/browse") || pathname.startsWith("/dashboard/client/cart");

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    const target = role === "OWNER" ? "/dashboard/owner/overview" : "/dashboard/client/overview";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith("/dashboard/owner") && role !== "OWNER") {
    if (isOwnerListingRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard/client") && role !== "CLIENT") {
    if (isClientShopRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|api/webhooks).*)",
  ],
};
