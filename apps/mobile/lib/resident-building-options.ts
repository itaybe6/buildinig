import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";

export type ResidentBuildingOption = {
  unitId: string;
  buildingId: string;
  label: string;
};

export async function getResidentBuildingOptions(
  client: SupabaseClient<Database>,
  params: { profileId: string; businessProfileId: string }
): Promise<ResidentBuildingOption[]> {
  const { data, error } = await client
    .from("units")
    .select(
      "id, building_id, buildings!inner ( id, address, city, business_profile_id )"
    )
    .eq("resident_profile_id", params.profileId)
    .eq("buildings.business_profile_id", params.businessProfileId);

  if (error || !data?.length) return [];

  const byBuilding = new Map<string, ResidentBuildingOption>();
  for (const row of data) {
    const b = row.buildings as unknown as {
      address: string;
      city: string;
    };
    const label = [b.address, b.city].filter(Boolean).join(", ") || "בניין";
    if (!byBuilding.has(row.building_id)) {
      byBuilding.set(row.building_id, {
        unitId: row.id,
        buildingId: row.building_id,
        label,
      });
    }
  }

  return Array.from(byBuilding.values());
}
