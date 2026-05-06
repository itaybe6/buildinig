import { PlaceholderScreen } from "@my-project/ui-mobile";
import { useLocalSearchParams } from "expo-router";

export default function ResidentRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PlaceholderScreen title={`קריאה ${String(id).slice(0, 8)}…`} />
  );
}
