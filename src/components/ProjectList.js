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
        setProjects(data.data); // Asumsikan data proyek ada di `data.data`
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <p className="text-center">Loading...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/project/${project.id}`}
          className="w-full max-w-md p-4 mb-4 rounded-lg shadow-md border bg-white text-gray-800 hover:bg-gray-100 cursor-pointer"
        >
          <ProjectCard
            name={project.name}
            owner={project.owner}
            value={project.value}
            status={project.status}
          />
        </Link>
      ))}
    </div>
  );
};

export default ProjectList;
