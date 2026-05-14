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

  const usage = await prisma.materialUsage.findMany({
    where,
    orderBy: { usedAt: "desc" },
    include: {
      material: true,
      usedBy: true,
    },
  });

  return Response.json({
    message: "Getting material usage success",
    data: usage,
  });
}

export async function POST(req) {
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!currentUser) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  // UPDATE HAK AKSES: Hanya TECH dan PM yang boleh input
  if (!["TECH", "PM"].includes(currentUser.role?.name)) {
    return Response.json({ message: "Forbidden: Anda tidak memiliki akses untuk mencatat pemakaian" }, { status: 403 });
  }

  const { projectId, materialId, quantity, usedAt } = await req.json();

  if (!projectId || !materialId || !quantity) {
    return Response.json({ message: "Project, material, dan jumlah wajib diisi" }, { status: 400 });
  }

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) return Response.json({ message: "Material not found" }, { status: 404 });

  const defaultPrice = material.defaultPrice ?? null;

  const newUsage = await prisma.materialUsage.create({
    data: {
      projectId,
      materialId,
      quantity: parseFloat(quantity),
      usedAt: usedAt ? new Date(usedAt) : new Date(),
      usedById: currentUser.id,
      unitPrice: defaultPrice,
    },
  });

  await logActivity({
    actorId: currentUser.id,
    action: "CREATE_MATERIAL_USAGE",
    targetType: "MATERIAL_USAGE",
    targetId: newUsage.id,
    projectId,
    metadata: {
      materialId,
      quantity: parseFloat(quantity),
      unitPrice: defaultPrice,
      role: currentUser.role?.name,
    },
  });

  return Response.json({ message: "Material usage created", data: newUsage }, { status: 201 });
}
