// (LIST semua user, hanya ADMIN/CEO)
import { prisma } from "@/app/lib/prisma";

export async function GET(req) {
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (
    !currentUser ||
    !["ADMIN", "CEO", "PM"].includes(currentUser.role?.name)
  ) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const roleName = searchParams.get("role");

  const whereRole = roleName ? { role: { name: roleName } } : {};

  const users = await prisma.user.findMany({
    where: whereRole,
    include: { role: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ message: "Get users success", data: users });
}
