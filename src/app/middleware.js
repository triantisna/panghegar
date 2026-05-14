import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function middleware(req) {
  const sessionCookie = req.cookies.get("user_session");
  const url = new URL(req.url);

  if (!sessionCookie) {
    if (url.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete("user_session");
    return res;
  }

  const role = user.role?.name;

  // CEO only
  if (url.pathname.startsWith("/dashboard/ceo") && role !== "CEO") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ADMIN (atau CEO)
  if (
    url.pathname.startsWith("/dashboard/admin") &&
    !["ADMIN", "CEO"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // PM only
  if (url.pathname.startsWith("/dashboard/pm") && role !== "PM") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // TECH only
  if (url.pathname.startsWith("/dashboard/tech") && role !== "TECH") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ENGINEER only (TAMBAHAN BARU)
  if (url.pathname.startsWith("/dashboard/engineer") && role !== "ENGINEER") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
