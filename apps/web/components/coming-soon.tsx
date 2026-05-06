import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";

export function ComingSoon({ title }: { title: string }) {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>בקרוב — העמוד בתהליך פיתוח</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          כאן תוצג הפונקציונליות המלאה בשלב הבא.
        </p>
      </CardContent>
    </Card>
  );
}
