import { ComingSoon } from "@/components/coming-soon";

export default function ServiceRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ComingSoon title={`קריאת שירות ${params.id.slice(0, 8)}…`} />;
}
