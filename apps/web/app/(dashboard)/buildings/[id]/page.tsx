import { ComingSoon } from "@/components/coming-soon";

export default function BuildingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ComingSoon title={`פרטי בניין (${params.id.slice(0, 8)}…)`} />;
}
