import { PlaceholderScreen } from "@my-project/ui-mobile";
import { useLocalSearchParams } from "expo-router";

export default function EmployeeAssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PlaceholderScreen title={`משימה ${String(id).slice(0, 8)}…`} />
  );
}
