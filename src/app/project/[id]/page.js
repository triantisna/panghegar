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

// Ambil Data Project Lengkap Tanpa Saringan Ketat di Level Database
async function getProjectData(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      estimates: {
        orderBy: { createdAt: 'desc' }
      },
      documents: true,
      client: true, 
      pm: { include: { role: true } },
      // Mengembalikan data pemakaian material beserta detail barang untuk ringkasan pemakaian
      materialUsage: { 
        include: {
          material: true
        }
      },
      operationalCosts: {
        include: { user: true }
      },
      // Mengembalikan relasi progress report terlengkap (menyelesaikan bug progress 0%)
      progressReports: {
        orderBy: { createdAt: 'desc' }
      },
      // Mengembalikan relasi assignments secara utuh lengkap dengan detail user dan role (menyelesaikan bug PM "-")
      assignments: {
        include: { 
          user: { 
            include: { 
              role: true 
            } 
          } 
        }
      }
    },
  });

  if (!project) return null;

  // 1. Ambil Progress Terakhir untuk komponen ringkasan progress card
  const latestProgress = project.progressReports?.[0] || null;

  // 2. Hitung Nilai Struktur RAB disetujui (APPROVED)
  const approvedEst = project.estimates.find(e => e.status === "APPROVED") || null;
  const rabMaterial = Number(approvedEst?.estimatedMaterialCost || 0);
  const rabOperational = Number(approvedEst?.estimatedOperationalCost || 0);

  // 3. Ambil dan susun array summary pemakaian material untuk komponen ringkasan list material di kanan bawah
  const usageSummaryMap = {};
  project.materialUsage?.forEach((usage) => {
    const matId = usage.materialId;
    const qty = Number(usage.quantity || 0);
    const price = Number(usage.material?.defaultPrice || 0);
    const matName = usage.material?.name || "Unknown";
    const matUnit = usage.material?.unit || "Unit";

    if (!usageSummaryMap[matId]) {
      usageSummaryMap[matId] = {
        materialId: matId,
        name: matName,
        unit: matUnit,
        totalQuantity: 0,
        totalCost: 0,
      };
    }
    usageSummaryMap[matId].totalQuantity += qty;
    usageSummaryMap[matId].totalCost += qty * price;
  });
  const materialUsageSummary = Object.values(usageSummaryMap);

  // 4. Hitung Realisasi Pemakaian Material berdasarkan nominal akumulasi harga (menyelesaikan bug pemakaian material 0)
  const realMaterial = materialUsageSummary.reduce((sum, item) => sum + item.totalCost, 0);

  // 5. Hitung Realisasi Biaya Operasional yang telah disetujui
  const approvedOps = project.operationalCosts?.filter(c => c.status === "APPROVED") || [];
  const realOperational = approvedOps.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  
  const operationalCostSummary = {
    totalAmount: realOperational,
    count: approvedOps.length
  };

  // 6. Satukan data summary finansial utama proyek
  const summary = {
    rabMaterial,
    rabOperational,
    rabTotal: rabMaterial + rabOperational,
    realMaterial,
    realOperational,
    realTotal: realMaterial + realOperational,
    diffTotal: (realMaterial + realOperational) - (rabMaterial + rabOperational),
  };

  // Ekstrak struktur response akhir agar 100% kompatibel dengan komponen DetailProjectClient.js Anda
  const result = {
    ...project,
    latestProgress,
    materialUsageSummary,
    operationalCostSummary,
    summary
  };

  // Bersihkan data dari tipe BigInt agar aman dibaca oleh Client Component
  return JSON.parse(JSON.stringify(result, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  ));
}

export default async function DetailProjectPage({ params }) {
  const { id: projectId } = await params;

  // Mengambil data sesi pengguna dan detail data proyek secara paralel langsung dari DB
  const [projectData, user] = await Promise.all([
    getProjectData(projectId),
    getSession(),
  ]);

  if (!projectData) return <div className="p-6">Project not found</div>;

  return (
    <DetailProjectClient
      projectId={projectId}
      data={projectData}
      role={user?.role?.name || ""}
      summary={projectData.summary}
    />
  );
}