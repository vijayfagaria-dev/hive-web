"use client";

import { GovHeader } from "@/components/governance/gov-header";
import { GovDashboard } from "@/components/governance/gov-dashboard";

export default function GovernanceDashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <GovHeader title="Dashboard" subtitle="The pulse of the flat's democracy." />
      <GovDashboard />
    </main>
  );
}
