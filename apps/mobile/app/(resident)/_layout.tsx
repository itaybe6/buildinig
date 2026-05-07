import { LogoutButton } from "@/components/LogoutButton";
import { Tabs } from "expo-router";

export default function ResidentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "בית", tabBarLabel: "בית" }} />
      <Tabs.Screen
        name="requests"
        options={{
          title: "מודעות וקריאות",
          tabBarLabel: "מודעות וקריאות",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{ title: "הצעות", tabBarLabel: "הצעות", headerShown: false }}
      />
      <Tabs.Screen
        name="payments"
        options={{ title: "תשלומים", tabBarLabel: "תשלומים" }}
      />
    </Tabs>
  );
}
