import { prisma } from "@/app/lib/prisma";

export async function GET(req, ctx) {
  const { id: projectId } = await ctx.params;

  // Ambil sesi user untuk membatasi dokumen bagi PM
  const sessionCookie = req.cookies.get("user_session");
  let currentUser = null;
  if (sessionCookie) {
    currentUser = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
      include: { role: true },
    });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      documents: true,
      pm: {
        include: { role: true },
      },
      estimates: {
        orderBy: { createdAt: "asc" },
        include: {
          project: false,
          createdBy: true,
        },
      },
      materialUsage: {
        include: { material: true, usedBy: { include: { role: true } } },
      },
      operationalCosts: true,
      progressReports: {
        orderBy: { createdAt: "desc" },
      },
      assignments: {
        include: {
          user: {
            include: { role: true },
          },
        },
      },
    },
  });

  if (!project) {
    return Response.json(
      { message: "Project not found", data: null },
      { status: 404 },
    );
  }

  // ==== Logic Proteksi Dokumen ====
  const isPM = currentUser?.role?.name === "PM";
  const visibleDocuments = isPM 
    ? project.documents.filter(doc => !["RAB_PDF", "SURAT_KONTRAK"].includes(doc.type))
    : project.documents;

  // ==== RAB & realisasi ====
  const approvedEstimates = project.estimates.filter(
    (e) => e.status === "APPROVED",
  );
  const latestApproved =
    approvedEstimates[approvedEstimates.length - 1] || null;

  const rabMaterialRaw = latestApproved?.estimatedMaterialCost ?? 0;
  const rabOperationalRaw = latestApproved?.estimatedOperationalCost ?? 0;
  const rabTotalRaw =
    latestApproved?.totalEstimate ?? rabMaterialRaw + rabOperationalRaw;

  const rabMaterial = Number(rabMaterialRaw);
  const rabOperational = Number(rabOperationalRaw);
  const rabTotal = Number(rabTotalRaw);

  const realMaterial = project.materialUsage.reduce((sum, u) => {
    const price =
      u.unitPrice != null
        ? Number(u.unitPrice)
        : u.material?.defaultPrice != null
          ? Number(u.material.defaultPrice)
          : 0;
    return sum + Number(u.quantity) * price;
  }, 0);

  const realOperational = project.operationalCosts
    .filter((c) => c.status === "APPROVED")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const realTotal = realMaterial + realOperational;

  const costSummary = {
    rabMaterial,
    rabOperational,
    rabTotal,
    realMaterial,
    realOperational,
    realTotal,
    diffTotal: realTotal - rabTotal,
  };

  // ==== Ringkasan progress terbaru ====
  const latestProgress = project.progressReports[0]
    ? {
        percentComplete: project.progressReports[0].percentComplete,
        createdAt: project.progressReports[0].createdAt,
      }
    : null;

  // ==== Ringkasan pemakaian material ====
  const materialUsageSummary = Object.values(
    project.materialUsage.reduce((acc, u) => {
      if (!u.material) return acc;
      const key = u.material.id;
      if (!acc[key]) {
        acc[key] = {
          materialId: u.material.id,
          name: u.material.name,
          unit: u.material.unit,
          totalQuantity: 0,
        };
      }
      acc[key].totalQuantity += u.quantity;
      return acc;
    }, {}),
  );

  // ==== Ringkasan biaya operasional ====
  const approvedCosts = project.operationalCosts.filter(
    (c) => c.status === "APPROVED",
  );

  const operationalCostSummary = {
    totalAmount: approvedCosts.reduce((sum, c) => sum + Number(c.amount), 0),
    count: approvedCosts.length,
  };
  
  // const totalOperationalAmount = approvedCosts.reduce(
  //   (sum, c) => sum + Number(c.amount),
  //   0,
  // );

  // const operationalCostSummary = {
  //   totalAmount: totalOperationalAmount,
  //   count: approvedCosts.length,
  // };

  // ==== Konversi BigInt ====
  const safeProject = {
    ...project,
    documents: visibleDocuments,
    value:
      typeof project.value === "bigint"
        ? project.value.toString()
        : project.value,
    estimates: project.estimates.map((e) => ({
      ...e,
      estimatedMaterialCost:
        typeof e.estimatedMaterialCost === "bigint"
          ? e.estimatedMaterialCost.toString()
          : e.estimatedMaterialCost,
      estimatedOperationalCost:
        typeof e.estimatedOperationalCost === "bigint"
          ? e.estimatedOperationalCost.toString()
          : e.estimatedOperationalCost,
      totalEstimate:
        typeof e.totalEstimate === "bigint"
          ? e.totalEstimate.toString()
          : e.totalEstimate,
    })),
    operationalCosts: project.operationalCosts.map((c) => ({
      ...c,
      amount: typeof c.amount === "bigint" ? c.amount.toString() : c.amount,
    })),
    materialUsage: project.materialUsage.map((u) => ({
      ...u,
      unitPrice:
        typeof u.unitPrice === "bigint" ? u.unitPrice.toString() : u.unitPrice,
      material: u.material
        ? {
            ...u.material,
            defaultPrice:
              typeof u.material.defaultPrice === "bigint"
                ? u.material.defaultPrice.toString()
                : u.material.defaultPrice,
          }
        : null,
    })),
  };

  return Response.json({
    message: "Single project fetched",
    data: {
      ...safeProject,
      costSummary,
      latestProgress,
      materialUsageSummary,
      operationalCostSummary,
    },
  });
}
