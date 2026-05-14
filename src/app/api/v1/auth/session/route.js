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
    include: { role: true },
  });

  if (!user) {
    return new Response(JSON.stringify({ message: "User not found" }), {
      status: 404,
    });
  }

  return new Response(
    JSON.stringify({
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
    }),
    { status: 200 }
  );
}
