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
