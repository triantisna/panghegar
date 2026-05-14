import { prisma } from "@/app/lib/prisma";
import { logActivity } from "@/app/lib/logActivity";
import { supabase } from "@/app/lib/supabase"; // Import client supabase

export async function POST(req, { params }) {
  try {
    const sessionCookie = req.cookies.get("user_session");
    if (!sessionCookie) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
      include: { role: true },
    });

    if (!user) return Response.json({ message: "User not found" }, { status: 404 });

    const { id } = await params;
    const { action, note } = await req.json();

    const cost = await prisma.operationalCost.findUnique({
      where: { id },
    });

    if (!cost) return Response.json({ message: "Operational cost not found" }, { status: 404 });

    // --- LOGIKA PENGHAPUSAN FOTO JIKA DI-REJECT ---
    let receiptUrlData = cost.receiptUrl;

    if (action === "REJECT") {
      if (receiptUrlData) {
        // Ambil path file dari URL (asumsi format: .../documents/receipts/filename.jpg)
        const urlParts = receiptUrlData.split("/documents/");
        const filePath = urlParts[1];

        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from("documents")
            .remove([filePath]);
          
          if (storageError) {
            console.error("Gagal menghapus storage:", storageError.message);
          }
        }
      }
      // Set receiptUrl menjadi null di database karena filenya sudah dihapus
      receiptUrlData = null;
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // Update database
    const updatedCost = await prisma.operationalCost.update({
      where: { id },
      data: { 
        status: newStatus,
        receiptUrl: receiptUrlData // Akan menjadi null jika di-reject
      },
    });

    // Catat di Approval
    await prisma.approval.create({
      data: {
        requestType: "COST",
        requestId: cost.id,
        approverId: user.id,
        action,
        note: note || null,
      },
    });

    // ==== ACTIVITY LOG ====
    await logActivity({
      actorId: user.id,
      action: newStatus === "APPROVED" ? "APPROVE_COST" : "REJECT_COST",
      targetType: "OPERATIONAL_COST",
      targetId: cost.id,
      projectId: cost.projectId,
      metadata: { 
        action, 
        hasImageDeleted: action === "REJECT" && cost.receiptUrl ? true : false 
      },
    });

    const safeData = {
      ...updatedCost,
      amount: updatedCost.amount.toString(),
    };

    return Response.json({
      message: `Cost ${newStatus.toLowerCase()} and cleanup success`,
      data: safeData,
    });
  } catch (err) {
    console.error("APPROVE_COST_ERROR:", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}