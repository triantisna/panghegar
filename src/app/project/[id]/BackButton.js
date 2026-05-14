"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BackButton() {
  const [href, setHref] = useState("/");

  useEffect(() => {
    const detectRole = async () => {
      try {
        const res = await fetch("/api/v1/auth/session");
        if (!res.ok) {
          setHref("/");
          return;
        }
        const data = await res.json();
        switch (data.role) {
          case "CEO":
            setHref("/dashboard/ceo");
            break;
          case "ADMIN":
            setHref("/dashboard/admin");
            break;
          case "ENGINEER":
            setHref("/dashboard/engineer");
            break;
          case "PM":
            setHref("/dashboard/pm");
            break;
          case "TECH":
            setHref("/dashboard/tech");
            break;
          default:
            setHref("/");
        }
      } catch {
        setHref("/");
      }
    };

    detectRole();
  }, []);

  return (
    <Link
      href={href}
      className="text-slate-100 hover:text-slate-400 transition duration-300 font-semibold text-lg"
    >
      &larr; Back
    </Link>
  );
}
