import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import DetailProjectClient from "./DetailProjectClient";

// Ambil Session langsung dari database
async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  if (!sessionCookie) return null;

  return await prisma.user.findUnique({
    where: { id: sessionCookie.value },
    select: { id: true, role: { select: { name: true } } },
  });
}

// Ambil Data Project dengan relasi lengkap yang dibutuhkan frontend
async function getProjectData(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      // 1. Ambil semua estimates untuk daftar pending dan data berkas link
      estimates: {
        orderBy: { createdAt: 'desc' }
      },
      // 2. Ambil dokumen berkas eksternal proyek (seperti RAB_PDF dan SURAT_KONTRAK)
      documents: true, 
      // 3. Ambil material requests untuk kalkulasi realisasi material ringkas
      materialRequests: {
        where: { status: "APPROVED" },
        select: { 
          quantity: true, 
          material: { select: { defaultPrice: true } } 
        }
      },
      // 4. Ambil biaya operasional untuk kalkulasi realisasi operasional ringkas
      operationalCosts: {
        where: { status: "APPROVED" },
        select: { amount: true }
      },
      // 5. Ambil penugasan tim proyek
      assignments: {
        include: { user: { select: { name: true, role: { select: { name: true } } } } }
      },
      // 6. Ambil laporan progress terakhir
      progressReports: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
  });

  if (!project) return null;

  // --- LOGIKA KALKULASI RAB YANG DISETUJUI (APPROVED) ---
  // Cari estimate dengan status APPROVED yang paling baru
  const approvedEst = project.estimates.find(e => e.status === "APPROVED") || null;

  // Nilai ini yang akan dikirim ke UI dan mengisi Rp. 0 Anda tadi
  const rabMaterial = Number(approvedEst?.estimatedMaterialCost || 0);
  const rabOperational = Number(approvedEst?.estimatedOperationalCost || 0);

  // --- LOGIKA KALKULASI REALISASI ---
  const realMaterial = project.materialRequests.reduce((sum, m) => {
    const price = Number(m.material?.defaultPrice || 0);
    const qty = Number(m.quantity || 0);
    return sum + (price * qty);
  }, 0);

  const realOperational = project.operationalCosts.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  // Gabungkan hasil ke dalam objek summary baku
  const summary = {
    rabMaterial,
    rabOperational,
    rabTotal: rabMaterial + rabOperational,
    realMaterial,
    realOperational,
    realTotal: realMaterial + realOperational,
    diffTotal: (realMaterial + realOperational) - (rabMaterial + rabOperational),
  };

  return JSON.parse(JSON.stringify({ ...project, summary }, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  ));
}

export default async function DetailProjectPage({ params }) {
  const { id: projectId } = await params;

  // Ambil data secara paralel
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