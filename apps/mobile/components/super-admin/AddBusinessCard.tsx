import { createBusinessRecords } from "@/lib/create-business";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  title?: string;
  subtitle?: string;
  onCreated?: (tenantId: string) => void;
  /** טופס ללא כותרת ומסגרת כרטיס — לעטיפת מסך ייעודי */
  embedded?: boolean;
};

export function AddBusinessCard({
  title = "הוספת עסק חדש",
  subtitle = "נוצרים tenants ו-business_profiles. לאחר מכן שייכו מנהל דרך tenant_id בפרופיל.",
  onCreated,
  embedded = false,
}: Props) {
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  async function onSubmit() {
    setFeedback(null);
    setBusy(true);
    const res = await createBusinessRecords(supabase, {
      name,
      legal_name: legalName || undefined,
      contact_email: email || undefined,
    });
    setBusy(false);
    if (res.ok) {
      setFeedback({ type: "ok", text: "העסק נוצר בהצלחה." });
      setName("");
      setLegalName("");
      setEmail("");
      onCreated?.(res.tenantId);
    } else {
      setFeedback({ type: "err", text: res.error });
    }
  }

  const fields = (
    <>
      <View className="mb-3">
        <Text className="mb-1 text-sm font-medium">שם העסק</Text>
        <TextInput
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-right"
          value={name}
          onChangeText={setName}
          placeholder="שם תצוגה"
        />
      </View>

      <View className="mb-3">
        <Text className="mb-1 text-sm font-medium">שם משפטי (אופציונלי)</Text>
        <TextInput
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-right"
          value={legalName}
          onChangeText={setLegalName}
          placeholder="חברה בע״מ"
        />
      </View>

      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium">אימייל (אופציונלי)</Text>
        <TextInput
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left"
          value={email}
          onChangeText={setEmail}
          placeholder="office@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {feedback ? (
        <Text
          className={`mb-3 text-sm ${
            feedback.type === "ok" ? "text-green-700" : "text-red-600"
          }`}
        >
          {feedback.text}
        </Text>
      ) : null}

      <Pressable
        className="rounded-xl bg-blue-600 px-4 py-3.5 active:opacity-90 disabled:opacity-50"
        onPress={() => void onSubmit()}
        disabled={busy}
      >
        <Text className="text-center text-base font-semibold text-white">
          {busy ? "יוצר…" : "צור עסק"}
        </Text>
      </Pressable>
    </>
  );

  if (embedded) {
    return <View>{fields}</View>;
  }

  return (
    <View className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <Text className="text-lg font-semibold text-slate-900">{title}</Text>
      <Text className="mb-4 text-sm text-slate-600">{subtitle}</Text>
      {fields}
    </View>
  );
}
