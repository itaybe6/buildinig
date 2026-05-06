import { createBusinessRecords } from "@/lib/create-business";
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
  subtitle = "נוצרים עסק, פרופיל עסק וחשבון מנהל. דורש EXPO_PUBLIC_WEB_APP_ORIGIN לכתובת שרת הווב.",
  onCreated,
  embedded = false,
}: Props) {
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [mgrName, setMgrName] = useState("");
  const [mgrEmail, setMgrEmail] = useState("");
  const [mgrPhone, setMgrPhone] = useState("");
  const [mgrPassword, setMgrPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  async function onSubmit() {
    setFeedback(null);
    setBusy(true);
    const res = await createBusinessRecords({
      name,
      legal_name: legalName || undefined,
      contact_email: email || undefined,
      manager_full_name: mgrName,
      manager_email: mgrEmail,
      manager_phone: mgrPhone || undefined,
      manager_password: mgrPassword,
    });
    setBusy(false);
    if (res.ok) {
      setFeedback({ type: "ok", text: "העסק והמנהל נוצרו בהצלחה." });
      setName("");
      setLegalName("");
      setEmail("");
      setMgrName("");
      setMgrEmail("");
      setMgrPhone("");
      setMgrPassword("");
      onCreated?.(res.tenantId);
    } else {
      setFeedback({ type: "err", text: res.error });
    }
  }

  const canSubmit =
    name.trim().length > 0 &&
    mgrName.trim().length > 0 &&
    mgrEmail.trim().length > 0 &&
    mgrPassword.length >= 6;

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

      <View className="mb-3">
        <Text className="mb-1 text-sm font-medium">
          אימייל עסק (אופציונלי)
        </Text>
        <TextInput
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left"
          value={email}
          onChangeText={setEmail}
          placeholder="office@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <Text className="mb-2 mt-2 text-sm font-semibold text-slate-800">
        מנהל העסק
      </Text>

      <View className="mb-3">
        <Text className="mb-1 text-sm font-medium">שם מלא</Text>
        <TextInput
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-right"
          value={mgrName}
          onChangeText={setMgrName}
          placeholder="שם המנהל"
        />
      </View>

      <View className="mb-3">
        <Text className="mb-1 text-sm font-medium">אימייל להתחברות</Text>
        <TextInput
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left"
          value={mgrEmail}
          onChangeText={setMgrEmail}
          placeholder="manager@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View className="mb-3">
        <Text className="mb-1 text-sm font-medium">טלפון (אופציונלי)</Text>
        <TextInput
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left"
          value={mgrPhone}
          onChangeText={setMgrPhone}
          placeholder="050-..."
          keyboardType="phone-pad"
        />
      </View>

      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium">סיסמה ראשונית (6+)</Text>
        <TextInput
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left"
          value={mgrPassword}
          onChangeText={setMgrPassword}
          placeholder="סיסמה"
          secureTextEntry
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
        disabled={busy || !canSubmit}
      >
        <Text className="text-center text-base font-semibold text-white">
          {busy ? "יוצר…" : "צור עסק ומנהל"}
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
