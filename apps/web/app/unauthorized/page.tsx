import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">אין הרשאה לכניסה מהדפדפן</h1>
      <p className="max-w-md text-muted-foreground">
        חשבון דייר מיועד לאפליקציית המובייל בלבד. נא להשתמש באפליקציית הדיירים.
      </p>
      <Link
        href="/login"
        className="text-primary underline-offset-4 hover:underline"
      >
        חזרה להתחברות
      </Link>
    </div>
  );
}
