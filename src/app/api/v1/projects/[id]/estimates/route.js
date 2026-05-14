import { prisma } from "@/app/lib/prisma";
import { logActivity } from "@/app/lib/logActivity";
import { supabase } from "@/app/lib/supabase";

export async function POST(req, context) {
  try {
    const { params } = context;
    const { id: projectId } = await params;

    const sessionCookie = req.cookies.get("user_session");
    if (!sessionCookie) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
      include: { role: true },
    });
    if (!user) return Response.json({ message: "User not found" }, { status: 404 });

    const role = user.role?.name;
    
    // Hak Akses: Hanya ENGINEER dan CEO
    if (!["ENGINEER", "CEO"].includes(role)) {
      return Response.json({ message: "Forbidden: Hanya Engineer/CEO yang bisa ubah RAB" }, { status: 403 });
    }

    // Gunakan formData karena kita mengirim file PDF
    const formData = await req.formData();
    const estimatedMaterialCost = formData.get("estimatedMaterialCost");
    const estimatedOperationalCost = formData.get("estimatedOperationalCost");
    const rabFile = formData.get("rabFile");
    const kontrakFile = formData.get("kontrakFile");

    if (!estimatedMaterialCost || !estimatedOperationalCost) {
      return Response.json({ message: "Material dan Operasional Cost wajib diisi" }, { status: 400 });
    }

    const material = BigInt(estimatedMaterialCost);
    const operational = BigInt(estimatedOperationalCost);
    const total = material + operational;

    // Fungsi helper upload ke Supabase
    const uploadToSupabase = async (file, folder) => {
      if (!file || typeof file === "string") return null;
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      
      const { data, error } = await supabase.storage.from("documents").upload(fileName, buffer, {
        contentType: file.type, upsert: false
      });
      if (error) throw new Error(`Upload error: ${error.message}`);
      
      const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    };

    // Eksekusi upload paralel
    const [rabUrl, kontrakUrl] = await Promise.all([
      uploadToSupabase(rabFile, "rab"),
      uploadToSupabase(kontrakFile, "kontrak")
    ]);

    // Simpan Estimasi & Dokumen
    const estimate = await prisma.projectEstimate.create({
      data: {
        projectId,
        estimatedMaterialCost: material,
        estimatedOperationalCost: operational,
        totalEstimate: total,
        createdById: user.id,
        status: role === "CEO" ? "APPROVED" : "PENDING",
        approvedById: role === "CEO" ? user.id : null,
      },
    });

    // Jika ada file, simpan ke database Document
    if (rabUrl || kontrakUrl) {
      const docsToCreate = [];
      if (rabUrl) docsToCreate.push({ projectId, uploadedById: user.id, fileUrl: rabUrl, type: "RAB_PDF" });
      if (kontrakUrl) docsToCreate.push({ projectId, uploadedById: user.id, fileUrl: kontrakUrl, type: "SURAT_KONTRAK" });

      await prisma.document.createMany({ data: docsToCreate });
    }

    // ==== ACTIVITY LOG ====
    await logActivity({
      actorId: user.id,
      action: role === "CEO" ? "CREATE_ESTIMATE_APPROVED" : "CREATE_ESTIMATE",
      targetType: "ESTIMATE",
      targetId: estimate.id,
      projectId: projectId,
      metadata: { role, status: estimate.status },
    });

    return Response.json({ message: "Project estimate created" }, { status: 201 });
  } catch (err) {
    return Response.json({ message: err.message }, { status: 500 });
  }
}