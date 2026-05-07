import { redirect } from "next/navigation";

/** נתיב ישן — מודעות מוזגו לעמוד קריאות */
export default function ResidentAnnouncementsRedirectPage() {
  redirect("/requests");
}
