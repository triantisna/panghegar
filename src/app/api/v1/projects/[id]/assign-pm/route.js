import { prisma } from "@/app/lib/prisma";

export async function PATCH(req, context) {
  const { params } = context;
  const { id: projectId } = await params;

  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!currentUser || !["CEO", "ADMIN"].includes(currentUser.role?.name)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { pmId, status, description, startDate, endDate } = await req.json();

  const updateData = {};

  // PM
  if (pmId !== undefined) {
    if (pmId === null || pmId === "") {
      updateData.pmId = null;
    } else {
      const pmUser = await prisma.user.findUnique({
        where: { id: pmId },
        include: { role: true },
      });
      if (!pmUser || pmUser.role?.name !== "PM") {
        return Response.json({ message: "Invalid PM user" }, { status: 400 });
      }
      updateData.pmId = pmId;
    }
  }

  // Status
  if (status) {
    updateData.status = status;
  }

  // Deskripsi
  if (description !== undefined) {
    updateData.description = description || null;
  }

  // Tanggal
  if (startDate !== undefined) {
    updateData.startDate = startDate ? new Date(startDate) : null;
  }
  if (endDate !== undefined) {
    updateData.endDate = endDate ? new Date(endDate) : null;
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: {
      pm: { include: { role: true } },
      client: true,
    },
  });

  // konversi BigInt sebelum dikirim
  const safeProject = {
    ...updatedProject,
    value:
      typeof updatedProject.value === "bigint"
        ? updatedProject.value.toString()
        : updatedProject.value,
  };

  return Response.json({
    message: "Project updated",
    data: safeProject,
  });
}
