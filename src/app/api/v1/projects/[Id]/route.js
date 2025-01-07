import { prisma } from "@/app/lib/prisma";

export async function GET(_, { params }) {
  const projectId = await params;
  const projectIdString = projectId?.Id;

  const project = await prisma.project.findUnique({
    where: {
      id: projectIdString,
    },
  });

  return Response.json({ message: "Ini Project Single", data: project });
}
