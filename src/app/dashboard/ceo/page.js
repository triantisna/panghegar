import React from "react";
import ProjectList from "@/components/ProjectList";
import Link from "next/link";

const ProjectsPage = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hallo,</h1>
        <h1 className="text-2xl font-bold">Daftar Proyek</h1>
        <Link href="/dashboard/ceo/addproject">
          <button className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600">
            + Tambah Proyek
          </button>
        </Link>
      </div>
      <ProjectList />
    </div>
  );
};

export default ProjectsPage;
