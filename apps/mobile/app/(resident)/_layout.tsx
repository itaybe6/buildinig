import { LogoutButton } from "@/components/LogoutButton";
import { Tabs } from "expo-router";

export default function ResidentTabsLayout() {
  return (
    <Tabs
      initialRouteName="requests"
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen
        name="requests"
        options={{
          title: "בית",
          tabBarLabel: "בית",
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
