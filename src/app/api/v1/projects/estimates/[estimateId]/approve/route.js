import { prisma } from "@/app/lib/prisma";
import { logActivity } from "@/app/lib/logActivity";

export async function POST(req, ctx) {
  const { estimateId } = await ctx.params;

  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!user) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  const role = user.role?.name;
  // Hanya CEO boleh approve / reject RAB
  if (role !== "CEO") {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json(); // "APPROVE" / "REJECT"

  if (!["APPROVE", "REJECT"].includes(action)) {
    return Response.json({ message: "Invalid action" }, { status: 400 });
  }

  const estimate = await prisma.projectEstimate.findUnique({
    where: { id: estimateId },
  });

  if (!estimate) {
    return Response.json(
      { message: "Project estimate not found" },
      { status: 404 }
    );
  }

  // Hanya boleh ubah dari PENDING
  if (estimate.status !== "PENDING") {
    return Response.json(
      { message: "Estimate is not in PENDING status" },
      { status: 400 }
    );
  }

  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updated = await prisma.projectEstimate.update({
    where: { id: estimateId },
    data: {
      status: newStatus,
      approvedById: user.id,
    },
  });

  await logActivity({
    actorId: user.id,
    action: newStatus === "APPROVED" ? "APPROVE_ESTIMATE" : "REJECT_ESTIMATE",
    targetType: "ESTIMATE",
    targetId: estimateId,
    projectId: estimate.projectId,
    metadata: {
      previousStatus: estimate.status,
      newStatus,
      action,
    },
  });

  const safeUpdated = {
    ...updated,
    estimatedMaterialCost: Number(estimate.estimatedMaterialCost),
    estimatedOperationalCost: Number(estimate.estimatedOperationalCost),
    totalEstimate: Number(estimate.totalEstimate),
  };

  return Response.json({
    message: `Estimate ${newStatus.toLowerCase()}`,
    data: safeUpdated,
  });
}
