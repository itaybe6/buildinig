"use client";

import {
  loginFormSchema,
  type LoginFormValues,
  type UserRole,
} from "@my-project/shared";
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
    defaultValues: { phone: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        phone: values.phone,
        password: values.password,
      }),
    });
    let payload: { error?: string } = {};
    try {
      payload = await res.json();
    } catch {
      setError("תגובת השרת לא תקינה");
      return;
    }
    if (!res.ok) {
      setError(payload.error ?? "התחברות נכשלה");
      return;
    }
    await supabase.auth.getSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("לא התקבל משתמש מהשרת");
      return;
    }
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const role = profileRow?.role as UserRole | undefined;
    router.refresh();
    if (role === "super_admin") {
      router.replace("/super-admin/dashboard");
    } else if (role === "resident") {
      router.replace("/home");
    } else if (role === "employee") {
      router.replace("/assignments");
    } else {
      router.replace("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">התחברות</h1>
          <p className="text-sm text-muted-foreground">
            התחברות — מספר טלפון וסיסמה
          </p>
        </div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="phone">מספר טלפון</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="050-0000000"
              dir="ltr"
              {...form.register("phone")}
            />
            {form.formState.errors.phone ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.phone.message}
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
          דיירים ועובדים יכולים להשתמש גם בדפדפן לאחר ההתחברות.
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
