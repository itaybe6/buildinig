import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

/** תאימות לאחור — נתיב ישן מפנה לעמוד הבקרה המלא של העסק */
export default async function TenantBuildingsLegacyRedirect(props: PageProps) {
  const params = await Promise.resolve(props.params);
  const searchParams = await Promise.resolve(props.searchParams ?? {});
  const qs = new URLSearchParams();
  if (searchParams.new_tenant === "1" || searchParams.new_tenant === "true") {
    qs.set("new_tenant", "1");
  }
  const q = qs.toString();
  redirect(`/super-admin/tenants/${params.id}${q ? `?${q}` : ""}`);
}
