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
        include: { user: true }
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

  // Konversi BigInt ke String agar aman dikirim ke Client Component
  const serializeBigInt = (obj) => {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    ));
  };

  return serializeBigInt(project);
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
  
  const summary = {
    rabMaterial,
    rabOperational,
    rabTotal: rabMaterial + rabOperational,
    // Sisanya akan dikalkulasi oleh Client Component atau bisa ditambahkan di sini
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