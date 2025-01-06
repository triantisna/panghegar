"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "@/components/InputField";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/v1/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message);
      router.push("/login");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="register-container">
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
        <InputField
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <InputField
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputField
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="input-container">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input-field"
            required
          >
            <option value="" disabled>
              Select Role
            </option>
            <option value="employee">Pegawai</option>
            <option value="coo">COO</option>
            <option value="ceo">CEO</option>
          </select>
        </div>
        <button type="submit" className="submit-button">
          Register
        </button>
      </form>
      <button className="secondary-button" onClick={() => router.push("/")}>
        Back to Login
      </button>
    </div>
  );
}
