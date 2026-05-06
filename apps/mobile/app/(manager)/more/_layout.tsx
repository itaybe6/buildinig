import { LogoutButton } from "@/components/LogoutButton";
import { Stack } from "expo-router";

export default function ManagerMoreStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "עוד" }} />
      <Stack.Screen name="residents" options={{ title: "דיירים" }} />
      <Stack.Screen name="employees" options={{ title: "עובדים" }} />
      <Stack.Screen name="announcements" options={{ title: "מודעות" }} />
      <Stack.Screen name="payments" options={{ title: "תשלומים" }} />
      <Stack.Screen name="service-types" options={{ title: "סוגי שירות" }} />
      <Stack.Screen name="tenant-settings" options={{ title: "הגדרות ארגון" }} />
      <Stack.Screen name="profile" options={{ title: "פרופיל" }} />
    </Stack>
  );
}
