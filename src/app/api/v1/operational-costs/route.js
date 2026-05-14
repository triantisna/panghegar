import { prisma } from "@/app/lib/prisma";
import { logActivity } from "@/app/lib/logActivity";
import { supabase } from "@/app/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const where = projectId ? { projectId } : {};

    const costs = await prisma.operationalCost.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        user: true, // supaya tahu siapa yang input
        project: true,
      },
    });

    // Konversi BigInt (amount) menjadi String agar bisa dikirim sebagai JSON
    const mapped = costs.map((c) => ({
      ...c,
      amount: typeof c.amount === "bigint" ? c.amount.toString() : c.amount,
      project: c.project
        ? {
            ...c.project,
            value: typeof c.project.value === "bigint" ? c.project.value.toString() : c.project.value,
          }
        : null,
    }));

    return Response.json({
      message: "Getting operational costs success",
      data: mapped,
    });
  } catch (err) {
    return Response.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sessionCookie = req.cookies.get("user_session");
    if (!sessionCookie) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
      include: { role: true },
    });

    if (!currentUser) return Response.json({ message: "User not found" }, { status: 404 });

    const role = currentUser.role?.name;
    const formData = await req.formData();
    
    const projectId = formData.get("projectId");
    const description = formData.get("description");
    const amountStr = formData.get("amount"); // Gunakan nama berbeda agar tidak tertukar
    const dateStr = formData.get("date");
    const photoFile = formData.get("photo");

    if (!dateStr || !description || !amountStr || !projectId) {
      return Response.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Upload Foto Struk ke Supabase
    let photoUrl = null;
    if (photoFile && typeof photoFile !== "string" && photoFile.size > 0) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const fileName = `receipts/${Date.now()}_${photoFile.name.replace(/\s+/g, "_")}`;
      
      const { data, error: storageError } = await supabase.storage
        .from("documents")
        .upload(fileName, buffer, { contentType: photoFile.type });

      if (storageError) throw new Error(`Upload struk gagal: ${storageError.message}`);
      
      const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(fileName);
      photoUrl = publicUrlData.publicUrl;
    }

    // 2. Tentukan Status Awal
    const initialStatus = role === "CEO" ? "APPROVED" : "PENDING";

    // 3. Simpan ke Database
    const newCost = await prisma.operationalCost.create({
      data: {
        date: new Date(dateStr),
        description,
        amount: BigInt(amountStr),
        receiptUrl: photoUrl,
        userId: currentUser.id,
        projectId,
        status: initialStatus,
      },
    });

    // 4. Log Activity (Pastikan metadata aman dari BigInt error)
    try {
      await logActivity({
        actorId: currentUser.id,
        action: "CREATE_OPERATIONAL_COST",
        targetType: "OPERATIONAL_COST",
        targetId: newCost.id,
        projectId,
        metadata: { 
          amount: Number(amountStr), 
          status: initialStatus, 
          role: role 
        },
      });
    } catch (logErr) {
      console.error("Gagal mencatat log, tapi data tetap tersimpan:", logErr);
    }

    return Response.json({ message: "Success", data: { ...newCost, amount: newCost.amount.toString() } }, { status: 201 });
  } catch (err) {
    console.error("SERVER ERROR OPERATIONAL COST:", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}