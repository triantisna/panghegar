import { prisma } from "@/app/lib/prisma";
import { logActivity } from "@/app/lib/logActivity";
import { supabase } from "@/app/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) return Response.json({ message: "projectId wajib diisi" }, { status: 400 });

  const reports = await prisma.progressReport.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return Response.json({ message: "Success", data: reports });
}

export async function POST(req) {
  try {
    const sessionCookie = req.cookies.get("user_session");
    if (!sessionCookie) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
      include: { role: true },
    });
    if (!user) return Response.json({ message: "User not found" }, { status: 404 });

    const role = user.role?.name;
    const formData = await req.formData();
    
    const projectId = formData.get("projectId");
    const notes = formData.get("notes");
    // Konsisten menggunakan nama 'percentInput' agar tidak bingung
    const percentInput = formData.get("percentComplete"); 
    const photoFile = formData.get("photo");

    // 1. Ambil data proyek untuk mendapatkan percent terakhir
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        progressReports: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    let finalPercent = currentProject?.progressReports[0]?.percentComplete ?? 0;

    // 2. Logika Update Progress (Hanya PM)
    // Cek jika percentInput TIDAK null (artinya ini form MASTER dari PM)
    if (percentInput !== null) {
      if (role !== "PM") {
        return Response.json({ message: "Hanya PM yang bisa update persentase utama" }, { status: 403 });
      }
      const parsedPercent = parseInt(percentInput, 10);
      if (isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
        return Response.json({ message: "Persentase tidak valid" }, { status: 400 });
      }
      finalPercent = parsedPercent;
    }

    // 3. Upload Foto ke Supabase
    let photoUrl = null;
    if (photoFile && typeof photoFile !== "string") {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const fileName = `progress/${Date.now()}_${photoFile.name.replace(/\s+/g, "_")}`;
      
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(fileName, buffer, { contentType: photoFile.type });

      if (error) throw new Error(`Upload gagal: ${error.message}`);
      const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(fileName);
      photoUrl = publicUrlData.publicUrl;
    }

    // 4. Simpan ke Database
    const report = await prisma.progressReport.create({
      data: {
        projectId,
        userId: user.id,
        percentComplete: finalPercent,
        notes: notes || null,
        photos: photoUrl,
      },
    });

    // ==== ACTIVITY LOG ====
    await logActivity({
      actorId: user.id,
      action: "CREATE_PROGRESS_REPORT",
      targetType: "PROGRESS_REPORT",
      targetId: report.id,
      projectId,
      metadata: { role, photoUrl, finalPercent },
    });

    return Response.json({ message: "Progress report created", data: report }, { status: 201 });
  } catch (err) {
    console.error("DEBUG PROGRESS ERROR:", err); // Log ini agar muncul di terminal VSCode Anda
    return Response.json({ message: err.message }, { status: 500 });
  }
}