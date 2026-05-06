import { LogoutButton } from "@/components/LogoutButton";
import { Tabs } from "expo-router";

export default function EmployeeTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen
        name="assignments"
        options={{
          title: "המשימות שלי",
          tabBarLabel: "משימות",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="all-requests"
        options={{ title: "כל הקריאות", tabBarLabel: "כל הקריאות" }}
      />
    </Tabs>
  );
}
