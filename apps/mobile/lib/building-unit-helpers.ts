export function compareUnitNumber(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function groupUnitNumbersByBuildingId(
  rows: { building_id: string; unit_number: string }[],
): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const r of rows) {
    const arr = m.get(r.building_id) ?? [];
    arr.push(r.unit_number);
    m.set(r.building_id, arr);
  }
  for (const arr of m.values()) {
    arr.sort(compareUnitNumber);
  }
  return m;
}

export function countUnitsByBuildingId(
  rows: { building_id: string }[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(r.building_id, (m.get(r.building_id) ?? 0) + 1);
  }
  return m;
}
