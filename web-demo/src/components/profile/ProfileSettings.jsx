// @ts-nocheck

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);

    const updatedUser = {
      ...user,
      voice_goal: goal,
      experience_level: level,
      target_pitch_range: pitchRange,
      training_focus: focus,
    };

    onUpdate?.(updatedUser);

    toast.success("Profile updated successfully");
    setSaving(false);
  };

  return (
    <div className="rounded-[28px] bg-card border border-border/70 p-6 space-y-6 shadow-[0_14px_28px_rgba(47,42,38,0.08)]">
      <h3 className="text-lg font-semibold text-foreground">
        Training Settings
      </h3>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Voice Goal</Label>
        <Select value={goal} onValueChange={setGoal}>
          <SelectTrigger className="bg-secondary border-border/70 rounded-[18px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feminize">Feminize Voice</SelectItem>
            <SelectItem value="masculinize">Masculinize Voice</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          Experience Level
        </Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="bg-secondary border-border/70 rounded-[18px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">
          Target Pitch Range
        </Label>
        <Slider
          value={pitchRange}
          onValueChange={setPitchRange}
          min={80}
          max={300}
          step={5}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{pitchRange[0]}Hz</span>
          <span>{pitchRange[1]}Hz</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Training Focus</Label>

        <div className="grid grid-cols-2 gap-3">
          {focusAreas.map(({ id, label }) => (
            <label
              key={id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                focus.includes(id)
                  ? "bg-primary/35 border-primary"
                  : "bg-secondary border-border/70 hover:border-chart-2"
              }`}
            >
              <Checkbox
                checked={focus.includes(id)}
                onCheckedChange={() => toggleFocus(id)}
              />
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground hover:bg-accent rounded-[20px] h-11 shadow-[0_12px_20px_rgba(47,42,38,0.10)]"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
