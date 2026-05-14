// app/api/v1/projects/route.js
import { prisma } from "@/app/lib/prisma";
import { supabase } from "@/app/lib/supabase";

async function getOrCreateClientByName(clientName) {
  const trimmed = clientName.trim();

  let client = await prisma.client.findFirst({
    where: { name: trimmed },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        name: trimmed,
      },
    });
  }

  return client;
}

export async function GET(req) {
  const sessionCookie = req.cookies.get("user_session");
  const currentUser = await prisma.user.findUnique({
    where: { id: sessionCookie?.value || "" },
    include: { role: true },
  });

  const projects = await prisma.project.findMany({
    orderBy: { status: "asc" },
    include: {
      client: true,
      pm: true,
      documents: true,
      progressReports: {
        orderBy: { createdAt: "desc" },
        select: {
          percentComplete: true,
          createdAt: true,
        },
        take: 1,
      },
    },
  });

  const mapped = projects.map((p) => {
    const isPM = currentUser?.role?.name === "PM";
    const latestProgress = p.progressReports[0] || null;

    return {
      ...p,
      value: p.value?.toString(),
      progressPercent: latestProgress?.percentComplete ?? 0,
      progressReports: undefined,
      // Logic proteksi dokumen: PM tidak bisa lihat file RAB & Kontrak
      documents: isPM
        ? p.documents.filter(
            (doc) => !["RAB_PDF", "SURAT_KONTRAK"].includes(doc.type),
          )
        : p.documents,
    };
  });

  return Response.json({ message: "Success", data: mapped });
}

export async function POST(req) {
  try {
    const sessionCookie = req.cookies.get("user_session");
    const user = await prisma.user.findUnique({
      where: { id: sessionCookie?.value || "" },
      include: { role: true },
    });

    // Izinkan CEO, ADMIN, dan ENGINEER
    if (!["CEO", "ADMIN", "ENGINEER"].includes(user?.role?.name)) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    // 1. Parse FormData
    const formData = await req.formData();
    const name = formData.get("name");
    const clientName = formData.get("clientName");
    const value = formData.get("value");
    const status = formData.get("status");
    const description = formData.get("description");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");

    // Ambil file
    const rabFile = formData.get("rabFile");
    const kontrakFile = formData.get("kontrakFile");

    // 2. Fungsi helper untuk upload ke Supabase
    const uploadToSupabase = async (file, folder) => {
      if (!file || typeof file === "string") return null;

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

      const { data, error } = await supabase.storage
        .from("documents") // Nama bucket yang kita buat di Step 1
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw new Error(`Upload error: ${error.message}`);

      // Ambil URL publiknya
      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    };

    // 3. Eksekusi Upload (Berjalan paralel agar lebih cepat)
    const [rabUrl, kontrakUrl] = await Promise.all([
      uploadToSupabase(rabFile, "rab"),
      uploadToSupabase(kontrakFile, "kontrak"),
    ]);

    // 4. Simpan ke Database
    const client = await getOrCreateClientByName(clientName); // Pakai fungsi yang sudah Anda buat

    const newProject = await prisma.project.create({
      data: {
        name,
        clientId: client.id,
        value: value ? BigInt(value) : null,
        status,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: user.id,
        documents: {
          create: [
            rabUrl && {
              fileUrl: rabUrl,
              type: "RAB_PDF",
              uploadedById: user.id,
            },
            kontrakUrl && {
              fileUrl: kontrakUrl,
              type: "SURAT_KONTRAK",
              uploadedById: user.id,
            },
          ].filter(Boolean), // Buang yang bernilai null
        },
      },
    });

    return Response.json(
      { message: "Project Created", id: newProject.id },
      { status: 201 },
    );
  } catch (err) {
    console.error("API Error:", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}
