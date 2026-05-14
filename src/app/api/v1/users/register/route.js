import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req) {
  const sessionCookie = req.cookies.get("user_session");

  // Optional: hanya user login (misal ADMIN/CEO) yang boleh register user baru
  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!currentUser || !["ADMIN", "CEO"].includes(currentUser.role?.name)) {
    return new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
    });
  }

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password || !role) {
    return Response.json(
      { message: "Name, email, password, and role are required" },
      { status: 400 }
    );
  }

  // Cari Role berdasarkan enum name
  const roleRecord = await prisma.role.findUnique({
    where: { name: role }, // role: "CEO" | "ADMIN" | "PM" | "TECH"
  });

  if (!roleRecord) {
    return Response.json({ message: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ message: "Email already used" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 11);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      roleId: roleRecord.id,
    },
    include: { role: true },
  });

  return Response.json(
    { message: "User created!", data: newUser },
    { status: 201 }
  );
}
