import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
  });

  return Response.json({
    message: "Get materials success",
    data: materials,
  });
}
