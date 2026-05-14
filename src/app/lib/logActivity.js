import { prisma } from "@/app/lib/prisma";

export async function logActivity({
  actorId,
  action,
  targetType,
  targetId,
  projectId,
  metadata,
}) {
  try {
    await prisma.activityLog.create({
      data: {
        actorId,
        action,       // contoh: "CREATE_PROJECT", "APPROVE_RAB"
        targetType,   // contoh: "PROJECT", "RAB", "MATERIAL_REQUEST"
        targetId,
        projectId: projectId || null,
        metadata: metadata || null,
      },
    });
  } catch (e) {
    // jangan sampai bikin API gagal hanya karena log error
    console.error("Failed to log activity", e);
  }
}
