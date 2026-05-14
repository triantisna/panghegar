import { prisma } from "@/app/lib/prisma";

export async function GET(req) {
  const sessionCookie = req.cookies.get("user_session");
  if (!sessionCookie) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!user || user.role?.name !== "PM") {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const projects = await prisma.project.findMany({
    where: { pmId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      progressReports: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const mapped = projects.map((p) => {
    const latestProgress = p.progressReports[0] || null;
    const progressPercent = latestProgress?.percentComplete ?? 0;

    return {
      ...p,
      value: typeof p.value === "bigint" ? p.value.toString() : p.value,
      progressPercent,
    };
  });

  return Response.json({
    message: "Getting PM projects success",
    data: mapped,
  });
}
