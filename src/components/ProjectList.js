"use client";

import React, { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard";

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
        <ProjectCard
          key={project.id}
          name={project.name}
          owner={project.owner}
          value={project.value}
          status={project.status}
        />
      ))}
    </div>
  );
};

export default ProjectList;
