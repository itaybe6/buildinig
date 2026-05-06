"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "outline" | "link";
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => void handleLogout()}
    >
      התנתק
    </Button>
  );
}
