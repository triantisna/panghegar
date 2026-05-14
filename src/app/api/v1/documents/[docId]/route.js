import { prisma } from "@/app/lib/prisma";
import { supabase } from "@/app/lib/supabase";

export async function DELETE(req, ctx) {
  try {
    const { docId } = await ctx.params;

    // Cek dokumen di database
    const document = await prisma.document.findUnique({ where: { id: docId } });
    if (!document) return Response.json({ message: "Document not found" }, { status: 404 });

    // Hapus file fisik dari Supabase Storage
    // Contoh URL: https://[projectId].supabase.co/storage/v1/object/public/documents/rab/123_file.pdf
    // Kita harus mengambil string "rab/123_file.pdf"
    const urlParts = document.fileUrl.split("/documents/"); 
    const filePathPath = urlParts[1]; 

    if (filePathPath) {
      const { error } = await supabase.storage.from("documents").remove([filePathPath]);
      if (error) console.error("Gagal hapus dari Supabase Storage:", error.message);
    }

    // Hapus dari database Prisma
    await prisma.document.delete({ where: { id: docId } });

    return Response.json({ message: "Document deleted successfully" }, { status: 200 });
  } catch (err) {
    return Response.json({ message: err.message }, { status: 500 });
  }
}