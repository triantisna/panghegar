"use client";

import React, { useState, useEffect } from "react";
import ProjectList from "@/components/ProjectList";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ProjectsPage = () => {
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const res = await fetch("/api/v1/auth/session"); // Endpoint untuk mendapatkan data user
      if (res.ok) {
        const data = await res.json();
        setUserName(data.name); // Asumsikan 'name' tersedia dalam sesi
      } else {
        console.error("Failed to fetch user data");
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/v1/users/logout", { method: "POST" });
    router.push("/"); // Redirect ke halaman utama setelah logout
  };

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 rounded-lg">
        <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-black truncate">
          Hallo, {userName}
        </h1>
        <button
          onClick={handleLogout}
          className="px-2 md:px-3 lg:px-4 py-1 md:py-2 lg:py-2 text-sm md:text-base lg:text-base rounded-md bg-red-500 text-white hover:bg-red-600 transition-transform transform hover:scale-105"
        >
          Logout
        </button>
      </div>
      <div className="flex items-center my-2">
        <div className="flex-grow h-[1px] bg-gray-300"></div>
        <span className="mx-2 font-bold text-black">Daftar Proyek</span>
        <div className="flex-grow h-[1px] bg-gray-300"></div>
      </div>
      <ProjectList />

      {/* Footer */}
      <Link href="/dashboard/ceo/addproject">
        <button className="fixed bottom-4 right-4 px-6 py-3 rounded-full bg-white text-black hover:bg-slate-300">
          + Tambah Proyek
        </button>
      </Link>
    </div>
  );
};

export default ProjectsPage;
