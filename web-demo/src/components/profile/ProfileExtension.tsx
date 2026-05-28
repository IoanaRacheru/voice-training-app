import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getSavedBackground } from "@/lib/profilePreferences";

type ProfileExtensionProps = {
  user: any;
  onUpdate?: (updates: any) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  registerSaveHandler?: (handler: () => Promise<boolean>) => void;
};

function areEqual(a: any, b: any) {
  return (
    a.identity_background === b.identity_background &&
    a.puberty_background === b.puberty_background &&
    String(a.age) === String(b.age)
  );
}

export default function ProfileExtension({ user, onUpdate, onDirtyChange, registerSaveHandler }: ProfileExtensionProps) {
  const saved = useMemo(() => getSavedBackground(user), [user]);
  const [draft, setDraft] = useState(saved);
  useEffect(() => setDraft(saved), [saved]);
  const isDirty = !areEqual(saved, draft);
  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);

  const handleSave = async () => {
    try {
      await onUpdate?.({
        identity_background: draft.identity_background,
        age: draft.age,
        puberty_background: draft.puberty_background,
      });
      toast.success("Background saved");
      return true;
    } catch {
      toast.error("Failed to save background.");
      return false;
    }
  };

  useEffect(() => {
    registerSaveHandler?.(handleSave);
  }, [registerSaveHandler, handleSave]);

  return (
    <section className="bg-white p-6 shadow-[0_24px_70px_rgba(17,17,17,0.07)]">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">Personalization</p>
        <h2 className="mt-2 text-2xl font-black uppercase text-foreground">Background</h2>
      </div>

      <div className="grid gap-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="identity-background" className="text-xs font-bold uppercase text-muted-foreground">Identity / background</Label>
          <Textarea
            id="identity-background"
            value={draft.identity_background}
            onChange={(event) => setDraft((prev: any) => ({ ...prev, identity_background: event.target.value }))}
            placeholder="Optional context that helps tailor practice."
          />
        </div>

        <div className="grid gap-5 border-t border-border pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-age" className="text-xs font-bold uppercase text-muted-foreground">Age</Label>
            <Input
              id="profile-age"
              type="number"
              min="1"
              max="120"
              value={draft.age}
              onChange={(event) => setDraft((prev: any) => ({ ...prev, age: event.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Puberty background</Label>
            <Select value={draft.puberty_background} onValueChange={(value) => setDraft((prev: any) => ({ ...prev, puberty_background: value }))}>
              <SelectTrigger aria-label="Puberty background" className="h-11 rounded-[2px] border border-border bg-white font-semibold shadow-none">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_puberty_voice">Pre-puberty voice</SelectItem>
                <SelectItem value="post_puberty_voice">Post-puberty voice</SelectItem>
                <SelectItem value="transitioning_voice_change">Transitioning / voice change in progress</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSave} className="h-11 w-full md:w-auto md:px-8">
          <Save className="h-4 w-4" />
          Save background
        </Button>
      </div>
    </section>
  );
}

