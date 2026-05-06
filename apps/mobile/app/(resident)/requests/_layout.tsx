import { Stack } from "expo-router";

export default function RequestsStackLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "הקריאות שלי" }} />
      <Stack.Screen name="new" options={{ title: "קריאה חדשה" }} />
      <Stack.Screen name="[id]" options={{ title: "פרטי קריאה" }} />
    </Stack>
  );
}
