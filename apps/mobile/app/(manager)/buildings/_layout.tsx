import { LogoutButton } from "@/components/LogoutButton";
import { Stack } from "expo-router";

export default function ManagerBuildingsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "בניינים" }} />
      <Stack.Screen name="[id]" options={{ title: "פרטי בניין" }} />
    </Stack>
  );
}
