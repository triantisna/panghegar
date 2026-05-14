// src/components/ProjectList.js
"use client";

import React, { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard";
import Link from "next/link";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/v1/projects");
        if (!res.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await res.json();
        setProjects(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <p className="text-center text-slate-500">Memuat data proyek...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="mt-10 text-center text-slate-500">
        Belum ada proyek yang terdaftar.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mt-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/project/${project.id}`}
          className="group"
        >
          <ProjectCard
            name={project.name}
            clientName={project.client?.name || "-"}
            value={project.value}
            status={project.status}
            endDate={project.endDate}
            progressPercent={project.progressPercent ?? 0}
          />
        </Link>
      ))}
    </div>
  );
};

export default ProjectList;
