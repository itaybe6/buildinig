import { PlaceholderScreen } from "@my-project/ui-mobile";
import { useLocalSearchParams } from "expo-router";

export default function ResidentQuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PlaceholderScreen title={`הצעת מחיר ${String(id).slice(0, 8)}…`} />
  );
}
