import { prisma } from "@/app/lib/prisma";

export async function GET(req) {
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const where = {};
  if (projectId) where.projectId = projectId;

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      actor: true,
      project: true,
    },
  });

  const mapped = logs.map((log) => ({
    ...log,
    project: log.project
      ? {
          ...log.project,
          value:
            typeof log.project.value === "bigint"
              ? log.project.value.toString()
              : log.project.value,
        }
      : null,
  }));

  return Response.json({
    message: "Getting activity logs success",
    data: mapped,
  });
}
