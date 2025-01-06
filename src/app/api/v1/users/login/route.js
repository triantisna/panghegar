import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";
import { serialize } from "cookie";

export async function POST(req) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return Response.json({ message: "Invalid Password" }, { status: 404 });
  }

  const sessionCookie = serialize("user_session", user.id, {
    httpOnly: true, // Tidak bisa diakses melalui JavaScript
    secure: process.env.NODE_ENV === "production", // Hanya aktif di HTTPS
    maxAge: 60 * 60 * 24 * 7, // Cookie berlaku selama 7 hari
    path: "/",
  });

  return new Response(JSON.stringify({ message: "Login success!" }), {
    status: 200,
    headers: { "Set-Cookie": sessionCookie },
  });
}
