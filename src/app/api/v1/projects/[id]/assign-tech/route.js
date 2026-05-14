// app/api/v1/projects/[id]/assign-tech/route.js
import { prisma } from "@/app/lib/prisma";

export async function GET(req, ctx) {
  const params = await ctx.params;
  const projectId = params.id;
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!currentUser || !["CEO", "PM"].includes(currentUser.role?.name)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const assignments = await prisma.assignment.findMany({
    where: { projectId },
    include: { user: { include: { role: true } } },
  });

  return Response.json({
    message: "Get technicians success",
    data: assignments,
  });
}

export async function POST(req, ctx) {
  const params = await ctx.params;
  const projectId = params.id;
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!currentUser || !["CEO", "PM"].includes(currentUser.role?.name)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { technicianId } = await req.json();

  const techUser = await prisma.user.findUnique({
    where: { id: technicianId },
    include: { role: true },
  });

  if (!techUser || techUser.role?.name !== "TECH") {
    return Response.json({ message: "Invalid technician" }, { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      userId: technicianId,
      projectId,
      role: "TEKNISI LAPANGAN",
    },
  });

  return Response.json(
    { message: "Technician assigned", data: assignment },
    { status: 201 }
  );
}

export async function DELETE(req, ctx) {
  const params = await ctx.params;
  const projectId = params.id;
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!currentUser || !["CEO", "PM"].includes(currentUser.role?.name)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { assignmentId } = await req.json();

  // Optional: bisa cek assignment.projectId === projectId
  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  return Response.json({ message: "Technician removed" });
}
