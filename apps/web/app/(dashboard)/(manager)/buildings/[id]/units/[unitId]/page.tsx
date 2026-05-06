import { ComingSoon } from "@/components/coming-soon";

export default function UnitDetailPage({
  params,
}: {
  params: { id: string; unitId: string };
}) {
  return (
    <ComingSoon
      title={`יחידה ${params.unitId.slice(0, 8)}… — בניין ${params.id.slice(0, 8)}…`}
    />
  );
}
