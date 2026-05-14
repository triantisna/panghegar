import { prisma } from "@/app/lib/prisma";
import { logActivity } from "@/app/lib/logActivity";

export async function GET(req) {
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const where = projectId ? { projectId } : {};

  const requests = await prisma.materialRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: true,
      material: true,
    },
  });

  return Response.json({
    message: "Getting material requests success",
    data: requests,
  });
}

export async function POST(req) {
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!user) return Response.json({ message: "User not found" }, { status: 404 });

  const role = user.role?.name;
  
  // UPDATE HAK AKSES: Hanya TECH dan PM yang boleh ajukan permintaan
  // CEO dan ENGINEER ditutup aksesnya untuk membuat permintaan baru
  if (!["TECH", "PM"].includes(role)) {
    return Response.json({ message: "Forbidden: Hanya Teknisi dan PM yang dapat mengajukan material" }, { status: 403 });
  }

  const { projectId, materialId, quantity, reason } = await req.json();

  if (!projectId || !materialId || !quantity) {
    return Response.json({ message: "Data tidak lengkap" }, { status: 400 });
  }

  const request = await prisma.materialRequest.create({
    data: {
      projectId,
      materialId,
      requestedById: user.id,
      quantity: parseFloat(quantity),
      reason: reason || null,
      status: "PENDING",
    },
  });

  // ==== ACTIVITY LOG ====
  await logActivity({
    actorId: user.id,
    action: "CREATE_MATERIAL_REQUEST",
    targetType: "MATERIAL_REQUEST",
    targetId: request.id,
    projectId,
    metadata: {
      materialId,
      quantity: parseFloat(quantity),
      reason: reason || null,
      status: "PENDING",
      role,
    },
  });

  return Response.json(
    { message: "Material request created", data: request },
    { status: 201 }
  );
}
