// @ts-nocheck

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Save } from "lucide-react";
import { toast } from "sonner";

const focusAreas = [
  { id: "pitch", label: "Pitch" },
  { id: "resonance", label: "Resonance" },
  { id: "intonation", label: "Intonation" },
  { id: "breath_control", label: "Breath Control" },
];

export default function ProfileSettings({ user, onUpdate }) {
  const [goal, setGoal] = useState(user?.voice_goal || "feminize");
  const [level, setLevel] = useState(user?.experience_level || "beginner");
  const [pitchRange, setPitchRange] = useState(
    user?.target_pitch_range || [160, 220]
  );
  const [focus, setFocus] = useState(user?.training_focus || ["pitch"]);
  const [saving, setSaving] = useState(false);

  const toggleFocus = (id) => {
    setFocus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate?.({
        voice_goal: goal,
        experience_level: level,
        target_pitch_range: pitchRange,
        training_focus: focus,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white p-6 shadow-[0_24px_70px_rgba(17,17,17,0.07)]">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">
          Editable record
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase text-foreground">
          Training settings
        </h2>
      </div>

      <div className="grid gap-7 pt-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Voice Goal
            </Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger className="h-11 rounded-[2px] border border-border bg-white font-semibold shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feminize">Feminize Voice</SelectItem>
                <SelectItem value="masculinize">Masculinize Voice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Experience Level
            </Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-11 rounded-[2px] border border-border bg-white font-semibold shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Target Pitch Range
            </Label>
            <span className="font-mono text-xs font-bold text-primary">
              {pitchRange[0]} Hz - {pitchRange[1]} Hz
            </span>
          </div>
          <Slider
            value={pitchRange}
            onValueChange={setPitchRange}
            min={80}
            max={300}
            step={5}
            className="py-5"
          />
        </div>

        <div className="space-y-3 border-t border-border pt-6">
          <Label className="text-xs font-bold uppercase text-muted-foreground">
            Training Focus
          </Label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {focusAreas.map(({ id, label }) => {
              const selected = focus.includes(id);

              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 border p-3 transition-colors ${
                    selected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-white text-foreground hover:border-foreground"
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => toggleFocus(id)}
                  />
                  <span className="text-sm font-bold">{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="h-11 w-full md:w-auto md:px-8">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </section>
  );
}
