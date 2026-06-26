import { redirect } from "next/navigation";

/** The backend deep-links notifications/web-push to /proposals/{id}; the UI lives
 *  under /governance. Forward so those links resolve. */
export default async function ProposalRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/governance/proposals/${id}`);
}
