import { Stack } from "expo-router";

export default function AssignmentsStackLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "המשימות שלי" }} />
      <Stack.Screen name="[id]" options={{ title: "פרטי משימה" }} />
    </Stack>
  );
}
