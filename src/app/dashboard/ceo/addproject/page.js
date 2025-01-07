"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AddProjectPage = () => {
  const router = useRouter();

  // State untuk form input
  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    detail: "",
    value: "",
    status: "",
  });
  const [userId, setUserId] = useState(""); // ID user yang login

  useEffect(() => {
    // Ambil ID user dari sesi atau API
    const fetchUserId = async () => {
      try {
        const res = await fetch("/api/v1/auth/session"); // Contoh endpoint sesi
        if (!res.ok) throw new Error("Failed to fetch session");
        const data = await res.json();
        setUserId(data.userId); // Asumsi `userId` tersedia dalam sesi
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchUserId();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userId }), // Tambahkan userId
      });

      if (!res.ok) {
        throw new Error("Failed to add project");
      }

      // Redirect ke dashboard setelah berhasil
      router.push("/dashboard/ceo");
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">
        Tambah Proyek Baru
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Nama Proyek"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
        <input
          type="text"
          name="owner"
          placeholder="Pemilik"
          value={formData.owner}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
        <textarea
          name="detail"
          placeholder="Detail Proyek"
          value={formData.detail}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
        <input
          type="number"
          name="value"
          placeholder="Nilai Proyek"
          value={formData.value}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        >
          <option value="" disabled>
            Pilih Status
          </option>
          <option value="negotiation">Negotiation</option>
          <option value="Kontrak">Kontrak</option>
          <option value="completed">Completed</option>
        </select>
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          disabled={!userId} // Tombol dinonaktifkan jika userId belum tersedia
        >
          Tambah Proyek
        </button>
      </form>
    </div>
  );
};

export default AddProjectPage;
