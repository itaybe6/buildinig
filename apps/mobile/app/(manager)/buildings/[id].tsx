import { inviteResidentToBuildingViaWebApi } from "@/lib/invite-building-resident";
import {
  linkResidentToUnitViaWebApi,
  postBuildingUnitsViaWebApi,
} from "@/lib/manager-building-units-api";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";
import {
  analyzeBulkUnitNumberIssues,
  formatILS,
  validateAndGenerateBulkUnits,
} from "@my-project/shared";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean | null;
};

type UnitRow = {
  id: string;
  unit_number: string;
  floor_number: number | null;
  type: string | null;
  resident: {
    id: string;
    full_name: string;
    phone: string | null;
  } | null;
};

type EligibleProfile = {
  id: string;
  full_name: string;
  phone: string | null;
};

type DraftRow = { unit_number: string; floor: string };

export default function ManagerBuildingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [committeeFee, setCommitteeFee] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [eligibleProfiles, setEligibleProfiles] = useState<EligibleProfile[]>(
    []
  );

  const [unitRows, setUnitRows] = useState<DraftRow[]>([
    { unit_number: "", floor: "" },
  ]);
  const [addMode, setAddMode] = useState<"manual" | "quick">("manual");
  const [bulkFloorFrom, setBulkFloorFrom] = useState("1");
  const [bulkFloorTo, setBulkFloorTo] = useState("");
  const [bulkUnitsPerFloor, setBulkUnitsPerFloor] = useState("2");
  const [bulkAptStart, setBulkAptStart] = useState("1");
  const bulkFloorsSeededForBuilding = useRef<string | null>(null);
  const [savingUnits, setSavingUnits] = useState(false);

  const [linkUnit, setLinkUnit] = useState<UnitRow | null>(null);
  const [linking, setLinking] = useState(false);

  const [inviteForUnitId, setInviteForUnitId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErr("לא מחובר");
      setLoading(false);
      return;
    }

    const { businessProfileId } = await resolveTenantScopeForUser(
      supabase,
      user.id
    );
    if (!businessProfileId) {
      setErr("חסר פרופיל עסק");
      setLoading(false);
      return;
    }

    const bid = Array.isArray(id) ? id[0] : id;

    const { data: building, error: bErr } = await supabase
      .from("buildings")
      .select("address, city, floors_count, committee_fee")
      .eq("id", bid)
      .eq("business_profile_id", businessProfileId)
      .maybeSingle();

    const { data: unitsRaw, error: uErr } = await supabase
      .from("units")
      .select("id, unit_number, floor_number, type, resident_profile_id")
      .eq("building_id", bid)
      .order("unit_number");

    const residentIds = [
      ...new Set(
        (unitsRaw ?? [])
          .map((u) => u.resident_profile_id)
          .filter((x): x is string => Boolean(x))
      ),
    ];

    const { data: residentRows, error: rsErr } =
      residentIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, full_name, phone")
            .in("id", residentIds)
        : { data: [] as { id: string; full_name: string; phone: string | null }[], error: null };

    const { data: linkedProfs, error: lpErr } =
      residentIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, full_name, phone, role, is_active")
            .in("id", residentIds)
            .order("full_name")
        : { data: [] as ProfileRow[], error: null };

    const profileById = new Map(
      (residentRows ?? []).map((p) => [p.id, p] as const)
    );

    const { data: orgBuildings } = await supabase
      .from("buildings")
      .select("id")
      .eq("business_profile_id", businessProfileId);

    const orgBuildingIds = (orgBuildings ?? []).map((b) => b.id);
    const { data: orgUnits } =
      orgBuildingIds.length > 0
        ? await supabase
            .from("units")
            .select("resident_profile_id")
            .in("building_id", orgBuildingIds)
        : { data: [] as { resident_profile_id: string | null }[] };

    const assignedResidentIds = new Set(
      (orgUnits ?? [])
        .map((x) => x.resident_profile_id)
        .filter((x): x is string => Boolean(x))
    );

    const { data: residentPool, error: poolErr } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("business_profile_id", businessProfileId)
      .eq("role", "resident")
      .order("full_name");

    const eligibleRaw = (residentPool ?? []).filter(
      (p) => !assignedResidentIds.has(p.id)
    );

    setLoading(false);

    if (bErr || !building) {
      setErr(bErr?.message ?? "בניין לא נמצא");
      return;
    }
    if (uErr) {
      setErr(uErr.message);
      return;
    }
    if (residentIds.length > 0 && (rsErr || lpErr)) {
      setErr(rsErr?.message ?? lpErr?.message ?? "שגיאת טעינה");
      return;
    }
    if (poolErr) {
      setErr(poolErr.message);
      return;
    }

    const merged: UnitRow[] = (unitsRaw ?? []).map((u) => {
      const rp = u.resident_profile_id
        ? profileById.get(u.resident_profile_id)
        : undefined;
      return {
        id: u.id,
        unit_number: u.unit_number,
        floor_number: u.floor_number,
        type: u.type,
        resident: rp
          ? { id: rp.id, full_name: rp.full_name, phone: rp.phone }
          : null,
      };
    });

    setAddress(building.address ?? "");
    setCity(building.city ?? "");
    setCommitteeFee(
      building.committee_fee != null ? String(building.committee_fee) : null
    );
    setProfiles((linkedProfs ?? []) as ProfileRow[]);
    setUnits(merged);
    setEligibleProfiles(eligibleRaw as EligibleProfile[]);

    const fc = building.floors_count;
    if (bulkFloorsSeededForBuilding.current !== bid) {
      bulkFloorsSeededForBuilding.current = bid;
      setBulkFloorFrom("1");
      setBulkFloorTo(fc != null && fc > 0 ? String(fc) : "");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const unitsSorted = useMemo(
    () =>
      [...units].sort((a, b) =>
        a.unit_number.localeCompare(b.unit_number, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      ),
    [units]
  );

  const bulkValidated = useMemo(() => {
    if (addMode !== "quick") return null;
    const floorFrom = Number.parseInt(bulkFloorFrom, 10);
    const floorTo = Number.parseInt(bulkFloorTo, 10);
    const unitsPerFloor = Number.parseInt(bulkUnitsPerFloor, 10);
    const aptTrim = bulkAptStart.trim();
    const aptStart =
      aptTrim === "" ? undefined : Number.parseInt(bulkAptStart, 10);
    return validateAndGenerateBulkUnits({
      floorFrom,
      floorTo,
      unitsPerFloor,
      apartmentStartIndex: aptStart,
    });
  }, [addMode, bulkFloorFrom, bulkFloorTo, bulkUnitsPerFloor, bulkAptStart]);

  const bulkIssues = useMemo(() => {
    if (!bulkValidated || !bulkValidated.ok) return null;
    return analyzeBulkUnitNumberIssues(
      bulkValidated.rows,
      unitsSorted.map((u) => u.unit_number)
    );
  }, [bulkValidated, unitsSorted]);

  async function persistUnitsRows(
    parsed: { unit_number: string; floor_number: number | null }[]
  ) {
    if (!id) return;
    const bid = Array.isArray(id) ? id[0] : id;
    setSavingUnits(true);
    const result = await postBuildingUnitsViaWebApi(bid, parsed);
    setSavingUnits(false);

    if (!result.ok) {
      Alert.alert("שגיאה", result.error);
      return;
    }

    setUnitRows([{ unit_number: "", floor: "" }]);
    void load();
    Alert.alert("הצלחה", "הדירות נשמרו.");
  }

  async function onSaveUnits() {
    const parsed = unitRows
      .map((r) => ({
        unit_number: r.unit_number.trim(),
        floor_number:
          r.floor.trim() === "" ? null : Number.parseInt(r.floor, 10),
      }))
      .filter((r) => r.unit_number.length > 0);

    if (!parsed.length) {
      Alert.alert("שגיאה", "הוסיפו לפחות דירה אחת.");
      return;
    }

    for (const p of parsed) {
      if (
        p.floor_number !== null &&
        (Number.isNaN(p.floor_number) || p.floor_number < 0)
      ) {
        Alert.alert("שגיאה", "מספר קומה חייב להיות מספר תקין.");
        return;
      }
    }

    await persistUnitsRows(parsed);
  }

  async function onSaveQuickUnits() {
    if (!bulkValidated || !bulkValidated.ok) {
      Alert.alert(
        "שגיאה",
        bulkValidated && !bulkValidated.ok
          ? bulkValidated.error
          : "מלאו את שדות הרשת במספרים תקינים."
      );
      return;
    }

    const issues = bulkIssues ?? {
      internalDuplicates: [] as string[],
      conflictsWithExisting: [] as string[],
    };

    if (issues.internalDuplicates.length) {
      Alert.alert("שגיאה", "נוצרו כפילויות פנימיות במספרי דירה.");
      return;
    }

    if (issues.conflictsWithExisting.length) {
      const list = issues.conflictsWithExisting.slice(0, 12).join(", ");
      Alert.alert(
        "שגיאה",
        `מספרי דירה שכבר קיימים בבניין: ${list}${
          issues.conflictsWithExisting.length > 12 ? " …" : ""
        }`
      );
      return;
    }

    await persistUnitsRows(bulkValidated.rows);
  }

  async function onLinkExisting(profileId: string) {
    if (!id || !linkUnit) return;
    const bid = Array.isArray(id) ? id[0] : id;
    setLinking(true);
    const result = await linkResidentToUnitViaWebApi(
      bid,
      linkUnit.id,
      profileId
    );
    setLinking(false);

    if (!result.ok) {
      Alert.alert("שגיאה", result.error);
      return;
    }

    setLinkUnit(null);
    void load();
    Alert.alert("הצלחה", "הדייר שויך לדירה.");
  }

  async function onInvite() {
    if (!id) return;
    const bid = Array.isArray(id) ? id[0] : id;
    setSaving(true);
    const result = await inviteResidentToBuildingViaWebApi(bid, {
      full_name: fullName.trim(),
      phone: phone.trim(),
      password,
      unit_id: inviteForUnitId ?? undefined,
    });
    setSaving(false);
    if (!result.ok) {
      Alert.alert("שגיאה", result.error);
      return;
    }
    setFullName("");
    setPassword("");
    setPhone("");
    setInviteForUnitId(null);
    void load();
    Alert.alert("הצלחה", "המשתמש נוצר ושויך לבניין.");
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (err) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-center text-red-600">{err}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-white px-4 pt-4">
        <Text className="mb-1 text-xl font-bold">
          {address.trim() || "—"}
        </Text>
        <Text className="mb-1 text-sm text-gray-600">{city.trim() || "—"}</Text>
        <Text className="mb-6 text-sm text-gray-600">
          דמי ועד בית (חודשי):{" "}
          {committeeFee != null ? formatILS(committeeFee) : "—"}
        </Text>

        <Text className="mb-2 font-semibold text-slate-800">הוספת דירות</Text>
        <View className="mb-3 flex-row gap-2">
          <Pressable
            className={`flex-1 rounded-lg py-2.5 ${
              addMode === "manual" ? "bg-slate-800" : "border border-gray-300"
            }`}
            onPress={() => setAddMode("manual")}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                addMode === "manual" ? "text-white" : "text-slate-700"
              }`}
            >
              ידני
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 rounded-lg py-2.5 ${
              addMode === "quick" ? "bg-slate-800" : "border border-gray-300"
            }`}
            onPress={() => setAddMode("quick")}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                addMode === "quick" ? "text-white" : "text-slate-700"
              }`}
            >
              הוספה מהירה
            </Text>
          </Pressable>
        </View>

        {addMode === "manual" ? (
          <>
            <Text className="mb-3 text-sm text-gray-600">
              ניתן להוסיף כמה דירות; לכל דירה ציינו מספר דירה וקומה.
            </Text>
            {unitRows.map((row, i) => (
              <View key={i} className="mb-3 flex-row gap-2">
                <TextInput
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-left"
                  placeholder="מספר דירה"
                  value={row.unit_number}
                  onChangeText={(v) =>
                    setUnitRows((prev) =>
                      prev.map((r, j) =>
                        j === i ? { ...r, unit_number: v } : r
                      )
                    )
                  }
                />
                <TextInput
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-left"
                  placeholder="קומה"
                  keyboardType="number-pad"
                  value={row.floor}
                  onChangeText={(v) =>
                    setUnitRows((prev) =>
                      prev.map((r, j) =>
                        j === i ? { ...r, floor: v } : r
                      )
                    )
                  }
                />
                {unitRows.length > 1 ? (
                  <Pressable
                    className="justify-center px-2"
                    onPress={() =>
                      setUnitRows((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    <Text className="text-red-600">✕</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Pressable
              className="mb-2 self-start rounded-lg border border-gray-300 px-3 py-2"
              onPress={() =>
                setUnitRows((prev) => [...prev, { unit_number: "", floor: "" }])
              }
            >
              <Text className="text-sm font-medium text-slate-700">
                שורה נוספת
              </Text>
            </Pressable>
            <Pressable
              className="mb-8 rounded-lg bg-slate-800 py-3 disabled:opacity-50"
              disabled={savingUnits}
              onPress={() => void onSaveUnits()}
            >
              <Text className="text-center font-semibold text-white">
                {savingUnits ? "שומר…" : "שמירת דירות"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="mb-3 text-sm text-gray-600">
              בחרו טווח קומות, כמה דירות בכל קומה, ומאיזה מספר דירה להתחיל בכל
              קומה (למשל 2-05).
            </Text>
            <Text className="mb-1 text-sm text-gray-600">מקומה</Text>
            <TextInput
              className="mb-3 rounded-lg border border-gray-300 px-3 py-2 text-left"
              placeholder="למשל 1 או 0 לקרקע"
              keyboardType="number-pad"
              value={bulkFloorFrom}
              onChangeText={setBulkFloorFrom}
            />
            <Text className="mb-1 text-sm text-gray-600">עד קומה</Text>
            <TextInput
              className="mb-3 rounded-lg border border-gray-300 px-3 py-2 text-left"
              placeholder="למשל 5"
              keyboardType="number-pad"
              value={bulkFloorTo}
              onChangeText={setBulkFloorTo}
            />
            <Text className="mb-1 text-sm text-gray-600">דירות בכל קומה</Text>
            <TextInput
              className="mb-3 rounded-lg border border-gray-300 px-3 py-2 text-left"
              placeholder="למשל 4"
              keyboardType="number-pad"
              value={bulkUnitsPerFloor}
              onChangeText={setBulkUnitsPerFloor}
            />
            <Text className="mb-1 text-sm text-gray-600">
              מספר דירה ראשון בכל קומה
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-gray-300 px-3 py-2 text-left"
              placeholder="ברירת מחדל 1"
              keyboardType="number-pad"
              value={bulkAptStart}
              onChangeText={setBulkAptStart}
            />
            <View className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {bulkValidated && bulkValidated.ok ? (
                <>
                  <Text className="text-sm font-semibold text-slate-800">
                    ייווצרו {bulkValidated.total} דירות
                  </Text>
                  <Text className="mt-1 text-sm text-gray-600">
                    קומות {bulkValidated.preview.floorFrom}–
                    {bulkValidated.preview.floorTo}; בכל קומה מספרי דירה{" "}
                    {bulkValidated.preview.apartmentSuffixFrom}–
                    {bulkValidated.preview.apartmentSuffixTo}
                  </Text>
                  <Text className="mt-1 text-sm text-gray-600">
                    טווח מלא: מ־{bulkValidated.preview.firstUnitNumber} עד{" "}
                    {bulkValidated.preview.lastUnitNumber}
                  </Text>
                  {bulkIssues && bulkIssues.conflictsWithExisting.length > 0 ? (
                    <Text className="mt-1 text-sm text-red-600">
                      חפיפה עם דירות קיימות:{" "}
                      {bulkIssues.conflictsWithExisting.slice(0, 8).join(", ")}
                      {bulkIssues.conflictsWithExisting.length > 8 ? " …" : ""}
                    </Text>
                  ) : (
                    <Text className="mt-1 text-sm text-gray-600">
                      דוגמה:{" "}
                      {bulkValidated.rows
                        .slice(0, 4)
                        .map((r) => r.unit_number)
                        .join(", ")}
                      {bulkValidated.total > 4 ? " …" : ""}
                    </Text>
                  )}
                </>
              ) : bulkValidated && !bulkValidated.ok ? (
                <Text className="text-sm text-red-600">{bulkValidated.error}</Text>
              ) : (
                <Text className="text-sm text-gray-500">
                  הזינו מספרים לתצוגה מקדימה.
                </Text>
              )}
            </View>
            <Pressable
              className="mb-8 rounded-lg bg-slate-800 py-3 disabled:opacity-50"
              disabled={savingUnits}
              onPress={() => void onSaveQuickUnits()}
            >
              <Text className="text-center font-semibold text-white">
                {savingUnits ? "שומר…" : "שמירת דירות"}
              </Text>
            </Pressable>
          </>
        )}

        <Text className="mb-2 font-semibold text-slate-800">דירות</Text>
        {units.length === 0 ? (
          <Text className="mb-6 text-gray-500">
            אין דירות רשומות — הוסיפו למעלה.
          </Text>
        ) : (
          <View className="mb-6 gap-2">
            {units.map((u) => (
              <View
                key={u.id}
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text className="font-medium">דירה {u.unit_number}</Text>
                {u.floor_number != null ? (
                  <Text className="text-sm text-gray-600">
                    קומה {u.floor_number}
                  </Text>
                ) : null}
                {u.resident ? (
                  <Text className="mt-1 text-sm text-slate-700">
                    דייר: {u.resident.full_name}
                    {u.resident.phone ? ` · ${u.resident.phone}` : ""}
                  </Text>
                ) : (
                  <Pressable
                    className="mt-2 self-start rounded-md bg-blue-600 px-3 py-1.5"
                    onPress={() => setLinkUnit(u)}
                  >
                    <Text className="text-sm font-semibold text-white">
                      קישור ללקוח
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        <Text className="mb-2 font-semibold text-slate-800">
          משתמשים משויכים לבניין
        </Text>
        {profiles.length === 0 ? (
          <Text className="mb-6 text-gray-500">
            אין עדיין פרופילים עם שיוך לבניין זה.
          </Text>
        ) : (
          <View className="mb-6 gap-2">
            {profiles.map((p) => (
              <View
                key={p.id}
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text className="font-medium">{p.full_name}</Text>
                <Text className="text-sm text-gray-600">
                  {p.phone ?? "—"} · {p.role}
                  {p.is_active === false ? " · לא פעיל" : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text className="mb-2 font-semibold text-slate-800">הוספת דייר</Text>
        <Text className="mb-3 text-sm text-gray-600">
          נדרש שרת Next עם SUPABASE_SERVICE_ROLE_KEY ו־EXPO_PUBLIC_WEB_APP_ORIGIN.
        </Text>
        {inviteForUnitId ? (
          <View className="mb-3 rounded-lg bg-slate-100 px-3 py-2">
            <Text className="text-sm text-slate-800">
              הדייר החדש ישויך לדירה שנבחרה.
            </Text>
            <Pressable onPress={() => setInviteForUnitId(null)} className="mt-1">
              <Text className="text-sm font-semibold text-blue-700">
                ביטול קישור דירה
              </Text>
            </Pressable>
          </View>
        ) : null}
        <TextInput
          className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
          placeholder="שם מלא"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
          placeholder="טלפון נייד (כניסה)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          className="mb-4 rounded-lg border border-gray-300 px-3 py-2 text-left"
          placeholder="סיסמה ראשונית"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          className="mb-8 rounded-lg bg-blue-600 py-3 disabled:opacity-50"
          disabled={
            saving ||
            !fullName.trim() ||
            !phone.trim() ||
            password.length < 6
          }
          onPress={() => void onInvite()}
        >
          <Text className="text-center font-semibold text-white">
            {saving ? "יוצר…" : "הוספת דייר"}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={linkUnit !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLinkUnit(null)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setLinkUnit(null)}
        >
          <Pressable
            className="max-h-[70%] rounded-t-2xl bg-white p-4"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-1 text-lg font-bold">
              קישור דירה {linkUnit?.unit_number ?? ""}
            </Text>
            <Text className="mb-4 text-sm text-gray-600">
              בחרו דייר קיים או צרו דייר חדש בטופס למטה.
            </Text>

            {eligibleProfiles.length === 0 ? (
              <Text className="mb-3 text-sm text-gray-500">
                אין דיירים זמינים בלי דירה — השתמשו ב&quot;דייר חדש&quot;.
              </Text>
            ) : (
              <ScrollView className="mb-4 max-h-48">
                {eligibleProfiles.map((p) => (
                  <Pressable
                    key={p.id}
                    className="border-b border-gray-100 py-3"
                    disabled={linking}
                    onPress={() => void onLinkExisting(p.id)}
                  >
                    <Text className="font-medium">{p.full_name}</Text>
                    <Text className="text-sm text-gray-600">
                      {p.phone ?? "—"}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Pressable
              className="mb-2 rounded-lg bg-blue-600 py-3 disabled:opacity-50"
              disabled={linking}
              onPress={() => {
                if (!linkUnit) return;
                setInviteForUnitId(linkUnit.id);
                setLinkUnit(null);
                Alert.alert(
                  "דייר חדש",
                  "מלאו את טופס ההוספה למטה — הדייר ישויך לדירה שנבחרה."
                );
              }}
            >
              <Text className="text-center font-semibold text-white">
                דייר חדש (טופס למטה)
              </Text>
            </Pressable>

            <Pressable
              className="rounded-lg border border-gray-300 py-3"
              onPress={() => setLinkUnit(null)}
            >
              <Text className="text-center font-medium text-slate-700">
                סגירה
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
