import { NextResponse } from "next/server";

const MAINTENANCE_COOKIE = "workahive_maintenance_bypass";

function isStaticAsset(pathname) {
  return /\.[^/]+$/.test(pathname);
}

export function middleware(req) {
  const maintenanceEnabled = process.env.MAINTENANCE_MODE === "true";

  if (!maintenanceEnabled) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  if (
    pathname === "/maintenance" ||
    pathname === "/api/maintenance/bypass" ||
    pathname.startsWith("/_next") ||
    isStaticAsset(pathname)
  ) {
    return NextResponse.next();
  }

  const bypassKey = process.env.MAINTENANCE_BYPASS_KEY;
  const bypassCookie = req.cookies.get(MAINTENANCE_COOKIE)?.value;

  if (bypassKey && bypassCookie === bypassKey) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json(
      {
        error: "WorkaHive is temporarily unavailable while maintenance is in progress.",
      },
      { status: 503 }
    );
  }

  const maintenanceUrl = req.nextUrl.clone();
  maintenanceUrl.pathname = "/maintenance";
  maintenanceUrl.search = "";

  return NextResponse.redirect(maintenanceUrl);
}

export const config = {
  matcher: "/:path*",
};
