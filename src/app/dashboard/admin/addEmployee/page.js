"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AddEmployeePage = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleOptions = ["CEO", "ADMIN", "PM", "TECH", "ENGINEER"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name || !form.email || !form.password || !form.role) {
      setError("Semua field wajib diisi");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user");
      alert("User created!");
      router.push("/dashboard/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Link
        href="/dashboard/admin"
        className="text-slate-100 hover:text-slate-400 transition duration-300 font-semibold text-lg"
      >
        &larr; Back
      </Link>

      <div className="login-container flex items-center justify-center mt-4">
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-lg w-full">
          <h1 className="text-2xl font-semibold text-center mb-4">
            Tambah Pegawai Baru
          </h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium">Nama</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium">
                Password Awal
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input-field"
              >
                <option value="" disabled>
                  Pilih Role
                </option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Submitting..." : "Tambah Pegawai"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeePage;
