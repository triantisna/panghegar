import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function middleware(req) {
  const sessionCookie = req.cookies.get("user_session");

  if (!sessionCookie) {
    // Redirect ke halaman login jika cookie tidak ditemukan
    return NextResponse.redirect(new URL("/", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
  });

  if (!user) {
    // Hapus cookie dan redirect jika user tidak ditemukan
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.delete("user_session");
    return response;
  }

  // Biarkan request melanjutkan jika valid
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"], // Middleware hanya berlaku untuk dashboard
};
