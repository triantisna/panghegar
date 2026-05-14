import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";
import { serialize } from "cookie";

export async function POST(req) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  if (!user.isActive) {
    return Response.json({ message: "User inactive" }, { status: 403 });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return Response.json({ message: "Invalid password" }, { status: 401 });
  }

  const sessionCookie = serialize("user_session", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return new Response(
    JSON.stringify({
      message: "Login success!",
      role: user.role?.name,
    }),
    {
      status: 200,
      headers: { "Set-Cookie": sessionCookie },
    }
  );
}
