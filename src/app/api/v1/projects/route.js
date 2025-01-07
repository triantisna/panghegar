"use server";

import { prisma } from "@/app/lib/prisma";

export async function GET(params) {
  const projects = await prisma.project.findMany({
    orderBy: {
      status: "desc",
    },
  });
  return Response.json({ message: "Getting projects succes", data: projects });
}

export async function POST(req) {
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

  // Parse JSON body
  const body = await req.json();
  const { name, owner, detail, value, status, userId } = body;

  // Buat project baru
  const newProject = await prisma.project.create({
    data: { name, owner, detail, value: parseInt(value), status, userId },
  });

  return Response.json({
    message: "Creating new projects succes",
    data: newProject,
  });
}
