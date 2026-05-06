import { LogoutButton } from "@/components/LogoutButton";
import { Stack } from "expo-router";

export default function ManagerServiceRequestsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "קריאות שירות" }} />
      <Stack.Screen name="[id]" options={{ title: "פרטי קריאה" }} />
    </Stack>
  );
}
