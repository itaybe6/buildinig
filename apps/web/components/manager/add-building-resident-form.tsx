"use client";

import { InviteResidentForm } from "@/components/manager/invite-resident-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AddBuildingResidentFormInner({
  buildingId,
}: {
  buildingId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitFromQuery = searchParams.get("resident_unit")?.trim() ?? "";

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">הוספת דייר</h2>
      <InviteResidentForm
        buildingId={buildingId}
        unitId={unitFromQuery}
        variant="page"
        formId="add-resident-form"
        onSuccess={
          unitFromQuery
            ? () => {
                router.replace(`/buildings/${buildingId}`);
              }
            : undefined
        }
      />
    </div>
  );
}

export function AddBuildingResidentForm({
  buildingId,
}: {
  buildingId: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          טוען טופס…
        </div>
      }
    >
      <AddBuildingResidentFormInner buildingId={buildingId} />
    </Suspense>
  );
}
