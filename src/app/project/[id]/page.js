import { headers } from "next/headers";
import DetailProjectClient from "./DetailProjectClient";

async function getProject(projectId) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data;
}

async function getSession(hdrs) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const cookie = (await hdrs).get("cookie") || "";
    const res = await fetch(`${baseUrl}/api/v1/auth/session`, {
      cache: "no-store",
      headers: { cookie },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DetailProjectPage(props) {
  const { id: projectId } = await props.params;
  const hdrs = headers();

  const [{ data }, session] = await Promise.all([
    getProject(projectId),
    getSession(hdrs),
  ]);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <p className="text-sm text-slate-600">Project not found</p>
      </div>
    );
  }

  const role = session?.role || "";
  const summary = data.costSummary || {
    rabMaterial: 0,
    rabOperational: 0,
    rabTotal: 0,
    realMaterial: 0,
    realOperational: 0,
    realTotal: 0,
    diffTotal: 0,
  };

  return (
    <DetailProjectClient
      projectId={projectId}
      data={data}
      role={role}
      summary={summary}
    />
  );
}
