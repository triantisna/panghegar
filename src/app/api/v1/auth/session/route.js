import { prisma } from "@/app/lib/prisma";

export async function GET(req) {
  const sessionCookie = req.cookies.get("user_session");

  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
  });

  if (!user) {
    return new Response(JSON.stringify({ message: "User not found" }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify({ name: user.name, userId: user.id }), {
    status: 200,
  });
}
