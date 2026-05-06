import { Tabs } from "expo-router";

export default function ManagerTabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen
        name="dashboard"
        options={{ title: "לוח בקרה", tabBarLabel: "בקרה" }}
      />
      <Tabs.Screen
        name="buildings"
        options={{
          title: "בניינים",
          tabBarLabel: "בניינים",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="service-requests"
        options={{
          title: "קריאות שירות",
          tabBarLabel: "קריאות",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="quote-requests"
        options={{
          title: "הצעות מחיר",
          tabBarLabel: "הצעות",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "עוד",
          tabBarLabel: "עוד",
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
