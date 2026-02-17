"use client";

import dynamic from "next/dynamic";

const DashboardPage = dynamic(
  () => import("@/components/pages/DashboardPage"),
  { ssr: false }
);

export default function Page() {
  return <DashboardPage />;
}
