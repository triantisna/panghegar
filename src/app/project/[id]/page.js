import Link from "next/link";

async function getProject(projectId) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/projects/${projectId}`);

  const data = await res.json();
  return data;
}

export default async function DetailProject({ params }) {
  const { id: projectId } = await params; // Menunggu params tersedia
  const { data } = await getProject(projectId);

  return (
    <div className="p-8 space-y-6 bg-blue-500 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <Link
          href="/dashboard/ceo"
          className="text-slate-100 hover:text-slate-400 transition duration-300 font-semibold text-lg"
        >
          &larr; Back
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900">{data.name}</h1>
        <button></button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl text-center font-semibold text-gray-800 mb-4">
          Project Details
        </h2>
        <hr></hr>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Owner:</span>
            <span className="font-medium text-gray-800">{data.owner}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Detail:</span>
            <span className="font-medium text-gray-800">{data.detail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span
              className={`font-medium ${
                data.status === "Active" ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Project Value:</span>
            <span className="font-medium text-gray-800">Rp. {data.value}</span>
          </div>
        </div>
      </div>

      {/* Optional: Cash Spent Section (uncomment if needed) */}
      {/* <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Total Cash Spent</h2>
        <p className="font-medium text-gray-800">Rp. {totalCash}</p>
      </div> */}
    </div>
  );
}
