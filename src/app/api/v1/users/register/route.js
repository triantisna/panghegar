import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req) {
  const { name, email, password, role } = await req.json();

  const hashedPassword = await bcrypt.hash(password, 11);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  return Response.json({ message: "user created!", data: newUser });
}
