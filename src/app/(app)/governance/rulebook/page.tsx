"use client";

import { GovHeader } from "@/components/governance/gov-header";
import { RuleBook } from "@/components/governance/rule-book";

export default function RuleBookPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <GovHeader title="Rule Book" subtitle="The flat's official rules — amended only by a vote." />
      <RuleBook />
    </main>
  );
}
