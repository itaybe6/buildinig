import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import Link from "next/link";

export default function ResidentNewQuotePlaceholderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          בקשת הצעת מחיר חדשה
        </h1>
        <p className="text-sm text-muted-foreground">
          כמו באפליקציית המובייל — טופס יתווסף בהמשך.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>בקרוב</CardTitle>
          <CardDescription>ניתן לצפות בבקשות קיימות ברשימת ההצעות.</CardDescription>
        </CardHeader>
      </Card>
      <Link
        href="/quotes"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        חזרה להצעות
      </Link>
    </div>
  );
}
