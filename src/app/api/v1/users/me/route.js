import { prisma } from "@/app/lib/prisma";
import { hash } from "bcryptjs";

export async function PATCH(req) {
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
  });

  if (!currentUser) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  const { name, password } = await req.json();

  const dataUpdate = {};
  if (name !== undefined && name.trim() !== "") {
    dataUpdate.name = name.trim();
  }

  if (password !== undefined && password.trim() !== "") {
    const hashed = await hash(password.trim(), 10);
    dataUpdate.password = hashed;
  }

  if (Object.keys(dataUpdate).length === 0) {
    return Response.json(
      { message: "Tidak ada perubahan yang dikirim" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: currentUser.id },
    data: dataUpdate,
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return Response.json({
    message: "Profile updated",
    data: updated,
  });
}
