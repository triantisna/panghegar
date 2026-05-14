// (UPDATE role user)
import { prisma } from "@/app/lib/prisma";

export async function PATCH(req, { params }) {
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!currentUser || !["ADMIN", "CEO"].includes(currentUser.role?.name)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const { roleName, isActive } = await req.json(); // roleName: "CEO" | "ADMIN" | "PM" | "TECH"

  let roleUpdate = {};
  if (roleName) {
    const roleRecord = await prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!roleRecord) {
      return Response.json({ message: "Invalid role" }, { status: 400 });
    }
    roleUpdate.roleId = roleRecord.id;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...roleUpdate,
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    },
    include: { role: true },
  });

  return Response.json({
    message: "User updated",
    data: updated,
  });
}
