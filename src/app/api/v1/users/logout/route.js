import { serialize } from "cookie";

export async function POST() {
  const sessionCookie = serialize("user_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // Hapus cookie dengan membuatnya kedaluwarsa
    path: "/",
  });

  return new Response(JSON.stringify({ message: "Logout success!" }), {
    status: 200,
    headers: { "Set-Cookie": sessionCookie },
  });
}
