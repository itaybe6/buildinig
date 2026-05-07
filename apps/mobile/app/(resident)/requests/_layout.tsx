import { LogoutButton } from "@/components/LogoutButton";
import { Stack } from "expo-router";

export default function RequestsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "מודעות וקריאות" }}
      />
      <Stack.Screen name="new" options={{ title: "קריאה חדשה" }} />
      <Stack.Screen
        name="new-announcement"
        options={{ title: "מודעה חדשה" }}
      />
      <Stack.Screen name="[id]" options={{ title: "פרטי קריאה" }} />
    </Stack>
  );
}
