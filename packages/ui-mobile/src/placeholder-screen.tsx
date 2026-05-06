import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
});

/** Scaffold placeholder — טקסט בעברית */
export function PlaceholderScreen({
  title,
  subtitle = "בקרוב",
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
