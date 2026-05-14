import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import DetailProjectClient from "./DetailProjectClient";

// Fungsi untuk ambil Session langsung dari database (tanpa fetch)
async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");

  if (!sessionCookie) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    include: { role: true },
  });

  if (!user) return null;

  return {
    userId: user.id,
    role: user.role?.name || "",
  };
}

// Fungsi untuk ambil Data Project langsung dari database (tanpa fetch)
async function getProjectData(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      estimates: true,
      materialRequests: {
        include: { requestedBy: true }
      },
      operationalCosts: {
        include: { user: true }
      },
      progressReports: {
        include: { user: true }
      },
      assignments: {
        include: { user: { include: { role: true } } }
      }
    },
  });

  if (!project) return null;

  // 1. Hitung RAB (dari estimates yang APPROVED)
  const approvedEstimate = project.estimates?.find(e => e.status === "APPROVED") || 
                           project.estimates?.[0]; // Fallback ke yang pertama jika tidak ada yang approved

  const rabMaterial = Number(approvedEstimate?.materialCost || 0);
  const rabOperational = Number(approvedEstimate?.operationalCost || 0);

  // 2. Hitung Realisasi (dari biaya yang sudah APPROVED)
  const realMaterial = project.materialRequests
    ?.filter(m => m.status === "APPROVED")
    .reduce((sum, m) => sum + Number(m.totalPrice || 0), 0) || 0;

  const realOperational = project.operationalCosts
    ?.filter(c => c.status === "APPROVED")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

  // 3. Gabungkan ke dalam objek summary
  const summary = {
    rabMaterial,
    rabOperational,
    rabTotal: rabMaterial + rabOperational,
    realMaterial,
    realOperational,
    realTotal: realMaterial + realOperational,
    diffTotal: (realMaterial + realOperational) - (rabMaterial + rabOperational),
  };

  // Bungkus project dan summary
  const result = {
    ...project,
    summary // Masukkan summary ke dalam objek data
  };

  // Konversi BigInt
  return JSON.parse(JSON.stringify(result, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  ));
}

export default async function DetailProjectPage({ params }) {
  const { id: projectId } = await params;

  // Ambil data secara paralel langsung dari DB
  const [projectData, session] = await Promise.all([
    getProjectData(projectId),
    getSession(),
  ]);

  if (!projectData) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <p className="text-sm text-slate-600">Project not found</p>
      </div>
    );
  }

  const role = session?.role || "";
  
  // Kalkulasi summary (bisa dilakukan langsung di sini)
  const rabMaterial = projectData.estimates?.reduce((sum, e) => sum + Number(e.materialCost || 0), 0) || 0;
const rabOperational = projectData.estimates?.reduce((sum, e) => sum + Number(e.operationalCost || 0), 0) || 0;

// Hitung realisasi dari biaya operasional dan material yang sudah disetujui
const realOperational = projectData.operationalCosts
  ?.filter(c => c.status === 'APPROVED')
  .reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

const realMaterial = projectData.materialRequests
  ?.filter(m => m.status === 'APPROVED')
  .reduce((sum, m) => sum + Number(m.totalPrice || 0), 0) || 0;

const summary = {
  rabMaterial,
  rabOperational,
  rabTotal: rabMaterial + rabOperational,
  realMaterial,
  realOperational,
  realTotal: realMaterial + realOperational,
  diffTotal: (rabMaterial + rabOperational) - (realMaterial + realOperational),
};

  return (
    <DetailProjectClient
      projectId={projectId}
      data={projectData}
      role={role}
      summary={summary}
    />
  );
}