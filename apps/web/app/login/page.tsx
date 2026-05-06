"use client";

import {
  loginFormSchema,
  type LoginFormValues,
  type UserRole,
} from "@my-project/shared";
import { Button, Input, Label } from "@my-project/ui-web";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

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
    const body = payload as { role?: UserRole };
    const role = body.role as UserRole | undefined;
    const path =
      role === "super_admin"
        ? "/super-admin/dashboard"
        : role === "resident"
          ? "/home"
          : role === "employee"
            ? "/assignments"
            : "/dashboard";
    /** טעינה מלאה — מבטיחה שקוקיות הסשן (שנקבעו ע"י ה-API) יישלחו לשרת */
    window.location.assign(path);
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
