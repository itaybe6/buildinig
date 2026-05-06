import { LogoutButton } from "@/components/LogoutButton";
import { Stack } from "expo-router";

export default function QuotesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "בקשות הצעת מחיר" }} />
      <Stack.Screen name="new" options={{ title: "בקשה חדשה" }} />
      <Stack.Screen name="[id]" options={{ title: "פרטי בקשה" }} />
    </Stack>
  );
}
