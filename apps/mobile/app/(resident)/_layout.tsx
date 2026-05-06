import { Tabs } from "expo-router";

export default function ResidentTabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen name="home" options={{ title: "בית", tabBarLabel: "בית" }} />
      <Tabs.Screen
        name="requests"
        options={{ title: "קריאות", tabBarLabel: "קריאות", headerShown: false }}
      />
      <Tabs.Screen
        name="quotes"
        options={{ title: "הצעות", tabBarLabel: "הצעות", headerShown: false }}
      />
      <Tabs.Screen
        name="payments"
        options={{ title: "תשלומים", tabBarLabel: "תשלומים" }}
      />
      <Tabs.Screen
        name="announcements"
        options={{ title: "מודעות", tabBarLabel: "מודעות" }}
      />
    </Tabs>
  );
}
