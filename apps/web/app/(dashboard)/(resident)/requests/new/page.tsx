import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import Link from "next/link";

export default function ResidentNewRequestPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          פתיחת קריאת שירות
        </h1>
        <p className="text-sm text-muted-foreground">
          כמו באפליקציית המובייל — טופס יתווסף בהמשך.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>בקרוב</CardTitle>
          <CardDescription>
            ניתן לעקוב אחר קריאות קיימות ברשימת הקריאות.
          </CardDescription>
        </CardHeader>
      </Card>
      <Link
        href="/requests"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        חזרה לקריאות
      </Link>
    </div>
  );
}
