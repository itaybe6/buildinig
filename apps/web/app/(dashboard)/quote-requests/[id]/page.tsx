import { ComingSoon } from "@/components/coming-soon";

export default function QuoteRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ComingSoon title={`בקשת הצעת מחיר ${params.id.slice(0, 8)}…`} />;
}
