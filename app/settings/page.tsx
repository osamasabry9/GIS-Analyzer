"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { saveSettings, loadSettings, type AppSettings } from "@/lib/settings";
import { Check, CircleAlert } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState<AppSettings>({
    mapboxToken: "",
    defaultTheme: "system",
    uploadMaxMb: 50,
  });
  const [saved, setSaved] = useState<"idle" | "ok" | "err">("idle");

  useEffect(() => {
    setForm(loadSettings());
  }, []);

  const onSave = () => {
    try {
      saveSettings(form);
      setSaved("ok");
      setTimeout(() => setSaved("idle"), 1500);
    } catch {
      setSaved("err");
      setTimeout(() => setSaved("idle"), 2000);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col">
      <main className="container mx-auto px-6 py-10 flex-1">
        <h1 className="text-3xl font-bold font-mono">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure API tokens and preferences.
        </p>
        <div className="mt-8 grid gap-6 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="mapbox">Mapbox Access Token (optional)</Label>
            <Input
              id="mapbox"
              placeholder="pk.eyJ..."
              value={form.mapboxToken}
              onChange={(e) =>
                setForm((f) => ({ ...f, mapboxToken: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              If provided, Mapbox styles will be available in the basemap
              switcher.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Default Theme</Label>
            <div className="flex gap-3">
              {(["system", "light", "dark"] as const).map((t) => (
                <Button
                  key={t}
                  variant={form.defaultTheme === t ? "default" : "outline"}
                  onClick={() => setForm((f) => ({ ...f, defaultTheme: t }))}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="upload-max">Upload Limit (MB)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="upload-max"
                type="number"
                min={1}
                max={1000}
                value={form.uploadMaxMb}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    uploadMaxMb: Number(e.target.value || 0),
                  }))
                }
              />
              <Switch
                checked={form.uploadMaxMb > 0}
                onCheckedChange={(checked) =>
                  setForm((f) => ({
                    ...f,
                    uploadMaxMb: checked ? f.uploadMaxMb || 50 : 0,
                  }))
                }
                aria-label="Enable upload limit"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Set 0 to disable client-side size checks.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={onSave}>Save</Button>
            {saved === "ok" ? (
              <span className="text-emerald-400 text-sm inline-flex items-center gap-1">
                <Check className="h-4 w-4" /> Saved
              </span>
            ) : saved === "err" ? (
              <span className="text-red-400 text-sm inline-flex items-center gap-1">
                <CircleAlert className="h-4 w-4" /> Error
              </span>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
