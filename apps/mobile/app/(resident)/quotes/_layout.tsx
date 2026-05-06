import { Stack } from "expo-router";

export default function QuotesStackLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "בקשות הצעת מחיר" }} />
      <Stack.Screen name="new" options={{ title: "בקשה חדשה" }} />
      <Stack.Screen name="[id]" options={{ title: "פרטי בקשה" }} />
    </Stack>
  );
}
