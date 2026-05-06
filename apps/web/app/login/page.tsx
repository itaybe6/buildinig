"use client";

import { loginFormSchema, type LoginFormValues } from "@my-project/shared";
import { Button, Input, Label } from "@my-project/ui-web";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (signError) {
      setError(signError.message);
      return;
    }
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">התחברות</h1>
          <p className="text-sm text-muted-foreground">
            ממשק מנהלים — אימייל וסיסמה
          </p>
        </div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              dir="ltr"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "מתחבר…" : "התחבר"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          דיירים / אפליקציית מובייל —{" "}
          <span className="font-medium">יש להשתמש באפליקציה</span>
        </p>
        <p className="text-center text-xs">
          <Link href="/" className="text-primary underline-offset-4 hover:underline">
            חזרה לדף הבית
          </Link>
        </p>
      </div>
    </div>
  );
}
