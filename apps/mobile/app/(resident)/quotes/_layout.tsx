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
      <Stack.Screen name="index" options={{ title: "שירותים" }} />
      <Stack.Screen name="new" options={{ title: "שירותים", headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "פרטי בקשה" }} />
    </Stack>
  );
}
