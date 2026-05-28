import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { getDefaultPitchRangeForGoal, getSavedProfilePreferences, normalizeVoiceGoal } from "@/lib/profilePreferences";

type ProfileSettingsProps = {
  user: any;
  onUpdate?: (updates: any) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  registerSaveHandler?: (handler: () => Promise<boolean>) => void;
};

function areEqual(a: any, b: any) {
  return (
    a.voice_goal === b.voice_goal &&
    a.pitch_target_enabled === b.pitch_target_enabled &&
    Number(a.target_pitch_range[0]) === Number(b.target_pitch_range[0]) &&
    Number(a.target_pitch_range[1]) === Number(b.target_pitch_range[1])
  );
}

function clampRange(range: number[]) {
  const min = Math.max(80, Math.min(300, Number(range[0]) || 80));
  const max = Math.max(min + 5, Math.min(300, Number(range[1]) || min + 5));
  return [Math.round(min), Math.round(max)];
}

export default function ProfileSettings({ user, onUpdate, onDirtyChange, registerSaveHandler }: ProfileSettingsProps) {
  const saved = useMemo(() => getSavedProfilePreferences(user), [user]);
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(saved), [saved]);

  const isDirty = !areEqual(saved, draft);
  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        voice_goal: normalizeVoiceGoal(draft.voice_goal),
        target_pitch_range: clampRange(draft.target_pitch_range),
        pitch_target_enabled: Boolean(draft.pitch_target_enabled),
      };
      await onUpdate?.(payload);
      toast.success("Training settings saved");
      return true;
    } catch {
      toast.error("Failed to save training settings.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    registerSaveHandler?.(handleSave);
  }, [registerSaveHandler, handleSave]);

  return (
    <section className="bg-white p-6 shadow-[0_24px_70px_rgba(17,17,17,0.07)]">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">Editable record</p>
        <h2 className="mt-2 text-2xl font-black uppercase text-foreground">Training settings</h2>
      </div>

      <div className="grid gap-7 pt-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Voice Goal</Label>
          <Select
            value={draft.voice_goal}
            onValueChange={(goal) =>
              setDraft((prev: any) => ({
                ...prev,
                voice_goal: goal,
                target_pitch_range: getDefaultPitchRangeForGoal(goal),
              }))
            }
          >
            <SelectTrigger className="h-11 rounded-[2px] border border-border bg-white font-semibold shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feminine">Feminine</SelectItem>
              <SelectItem value="masculine">Masculine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border-t border-border pt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Target Pitch Range</Label>
              <Switch
                checked={draft.pitch_target_enabled}
                onCheckedChange={(checked) => setDraft((prev: any) => ({ ...prev, pitch_target_enabled: Boolean(checked) }))}
                aria-label="Enable pitch target"
              />
            </div>
            <span className="font-mono text-xs font-bold text-primary">
              {draft.target_pitch_range[0]} Hz - {draft.target_pitch_range[1]} Hz
            </span>
          </div>

          <Slider
            value={draft.target_pitch_range}
            onValueChange={(value) => setDraft((prev: any) => ({ ...prev, target_pitch_range: clampRange(value) }))}
            thumbOnlyDrag
            min={80}
            max={300}
            step={1}
            className="py-2"
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="h-11 w-full md:w-auto md:px-8">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </section>
  );
}

