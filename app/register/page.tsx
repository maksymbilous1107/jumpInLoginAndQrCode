"use client";

import dynamic from "next/dynamic";

const RegisterPage = dynamic(
  () => import("@/components/pages/RegisterPage"),
  { ssr: false }
);

export default function Page() {
  return <RegisterPage />;
}
