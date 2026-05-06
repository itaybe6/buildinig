"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressLogoFile } from "@/lib/manager/compress-logo-client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

type Props = {
  tenantId: string;
  /** ערך נוכחי לשדה המוסתר בטופס */
  logoUrl: string;
  onLogoUrlChange: (url: string) => void;
  disabled?: boolean;
};

export function BusinessLogoUpload({
  tenantId,
  logoUrl,
  onLogoUrlChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(logoUrl || null);

  const displaySrc = preview || logoUrl || null;

  const onPick = useCallback(() => {
    setErr(null);
    inputRef.current?.click();
  }, []);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) {
        return;
      }

      setBusy(true);
      setErr(null);
      try {
        const blob = await compressLogoFile(file);
        const supabase = createClient();
        const path = `${tenantId}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("business-logos")
          .upload(path, blob, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (upErr) {
          setErr(upErr.message);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("business-logos").getPublicUrl(path);

        setPreview(publicUrl);
        onLogoUrlChange(publicUrl);
      } catch (x) {
        setErr(x instanceof Error ? x.message : "שגיאת העלאה");
      } finally {
        setBusy(false);
      }
    },
    [onLogoUrlChange, tenantId]
  );

  const onRemove = useCallback(() => {
    setPreview(null);
    onLogoUrlChange("");
  }, [onLogoUrlChange]);

  return (
    <div className="space-y-3">
      <Label>לוגו העסק</Label>
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            "relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40",
            displaySrc ? "" : "border-dashed"
          )}
        >
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL דינמי מ-Supabase Storage
            <img
              src={displaySrc}
              alt=""
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span className="px-2 text-center text-xs text-muted-foreground">
              אין לוגו
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            JPG / PNG / WebP — יידחס אוטומטית לפני שמירה (עד ~512px רוחב).
          </p>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || busy}
              onClick={onPick}
            >
              {busy ? "מעלה…" : displaySrc ? "החלפת לוגו" : "העלאת לוגו"}
            </Button>
            {displaySrc ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || busy}
                onClick={onRemove}
              >
                הסרת תצוגה
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(ev) => void onFile(ev)}
      />
    </div>
  );
}
