import { ComingSoon } from "@/components/coming-soon";

export default function TenantBuildingsPage({
  params,
}: {
  params: { id: string };
}) {
  return <ComingSoon title={`בניינים לפי חברת ניהול (${params.id.slice(0, 8)}…)`} />;
}
