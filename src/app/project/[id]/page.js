import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import DetailProjectClient from "./DetailProjectClient";

// 1. Session check dibuat se-minimal mungkin
async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  if (!sessionCookie) return null;

  return await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    select: { id: true, role: { select: { name: true } } },
  });
}

async function getProjectData(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      // Ambil data estimates untuk hitung RAB
      estimates: {
        where: { status: "APPROVED" },
        take: 1 // Cukup ambil yang sudah disetujui saja
      },
      // Ambil ringkasan realisasi tanpa menarik seluruh detail user di sini
      materialRequests: {
        where: { status: "APPROVED" },
        select: { totalPrice: true } 
      },
      operationalCosts: {
        where: { status: "APPROVED" },
        select: { amount: true }
      },
      // Ambil data dasar untuk kartu detail
      assignments: {
        include: { user: { select: { name: true, role: { select: { name: true } } } } }
      },
      // Ambil progress terakhir saja untuk LCP
      progressReports: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
  });

  if (!project) return null;

  // KALKULASI DI SERVER (Cepat)
  const approvedEst = project.estimates[0] || null;
  const rabMaterial = Number(approvedEst?.materialCost || 0);
  const rabOperational = Number(approvedEst?.operationalCost || 0);

  const realMaterial = project.materialRequests.reduce((sum, m) => sum + Number(m.totalPrice || 0), 0);
  const realOperational = project.operationalCosts.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const summary = {
    rabMaterial,
    rabOperational,
    rabTotal: rabMaterial + rabOperational,
    realMaterial,
    realOperational,
    realTotal: realMaterial + realOperational,
    diffTotal: (rabMaterial + rabOperational) - (realMaterial + realOperational),
  };

  // Bersihkan data dari BigInt dan kirim yang diperlukan saja
  return JSON.parse(JSON.stringify({ ...project, summary }, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  ));
}

export default async function DetailProjectPage({ params }) {
  const { id: projectId } = await params;

  // Ambil data paralel
  const [projectData, user] = await Promise.all([
    getProjectData(projectId),
    getSession(),
  ]);

  if (!projectData) return <div>Project not found</div>;

  return (
    <DetailProjectClient
      projectId={projectId}
      data={projectData}
      role={user?.role?.name || ""}
      summary={projectData.summary}
    />
  );
}