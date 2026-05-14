import { prisma } from "@/app/lib/prisma";
import { logActivity } from "@/app/lib/logActivity";

export async function POST(req, { params }) {
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
  // hanya PM & CEO yang boleh approve
  if (!["PM", "CEO"].includes(role)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const { action, note } = await req.json();

  if (!["APPROVE", "REJECT"].includes(action)) {
    return Response.json({ message: "Invalid action" }, { status: 400 });
  }

  const reqData = await prisma.materialRequest.findUnique({
    where: { id },
  });

  if (!reqData) {
    return Response.json(
      { message: "Material request not found" },
      { status: 404 }
    );
  }

  // cegah self-approval
  if (reqData.requestedById === user.id) {
    return Response.json(
      { message: "Tidak boleh approve permintaan sendiri" },
      { status: 403 }
    );
  }

  // jika peminta adalah PM, hanya CEO yang boleh approve
  const requester = await prisma.user.findUnique({
    where: { id: reqData.requestedById },
    include: { role: true },
  });

  if (requester?.role?.name === "PM" && role !== "CEO") {
    return Response.json(
      { message: "Permintaan dari PM hanya boleh di-approve CEO" },
      { status: 403 }
    );
  }

  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updatedReq = await prisma.materialRequest.update({
    where: { id },
    data: { status: newStatus },
  });

  await prisma.approval.create({
    data: {
      requestType: "MATERIAL",
      requestId: reqData.id,
      approverId: user.id,
      action,
      note: note || null,
      materialRequestId: reqData.id,
    },
  });

  // ==== ACTIVITY LOG ====
  await logActivity({
    actorId: user.id,
    action:
      newStatus === "APPROVED"
        ? "APPROVE_MATERIAL_REQUEST"
        : "REJECT_MATERIAL_REQUEST",
    targetType: "MATERIAL_REQUEST",
    targetId: reqData.id,
    projectId: reqData.projectId,
    metadata: {
      previousStatus: reqData.status,
      newStatus,
      action,
      note: note || null,
      requesterId: reqData.requestedById,
      requesterRole: requester?.role?.name || null,
    },
  });

  return Response.json({
    message: `Material request ${newStatus.toLowerCase()}`,
    data: updatedReq,
  });
}
