// @ts-nocheck

import React, { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const goalOptions = [
  { id: "singing", label: "Singing" },
  { id: "communication", label: "Communication" },
  { id: "acting", label: "Acting" },
  { id: "voice_feminization_masculinization", label: "Voice feminization / masculinization" },
  { id: "public_speaking", label: "Public speaking" },
];

export default function ProfileExtension({ user, onUpdate }) {
  const [identityBackground, setIdentityBackground] = useState(
    user?.identity_background || ""
  );
  const [age, setAge] = useState(user?.age || "");
  const [pubertyBackground, setPubertyBackground] = useState(
    user?.puberty_background || ""
  );
  const [goals, setGoals] = useState(user?.personalization_goals || []);

  const toggleGoal = (id) => {
    setGoals((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSave = () => {
    onUpdate?.({
      ...user,
      identity_background: identityBackground,
      personalization_goals: goals,
      age,
      puberty_background: pubertyBackground,
    });
    toast.success("Profile personalization saved");
  };

  return (
    <section className="bg-white p-6 shadow-[0_24px_70px_rgba(17,17,17,0.07)]">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">
          Personalization
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase text-foreground">
          Background and goals
        </h2>
      </div>

      <div className="grid gap-6 pt-6">
        <div className="space-y-2">
          <Label
            htmlFor="identity-background"
            className="text-xs font-bold uppercase text-muted-foreground"
          >
            Identity / background
          </Label>
          <Textarea
            id="identity-background"
            value={identityBackground}
            onChange={(event) => setIdentityBackground(event.target.value)}
            placeholder="Optional context that helps tailor practice."
          />
        </div>

        <div className="space-y-3 border-t border-border pt-6">
          <Label className="text-xs font-bold uppercase text-muted-foreground">
            Goals
          </Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {goalOptions.map(({ id, label }) => {
              const checked = goals.includes(id);

              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 border p-3 transition-colors ${
                    checked
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-white text-foreground hover:border-foreground"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleGoal(id)}
                    aria-label={label}
                  />
                  <span className="text-sm font-bold">{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 border-t border-border pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="profile-age"
              className="text-xs font-bold uppercase text-muted-foreground"
            >
              Age
            </Label>
            <Input
              id="profile-age"
              type="number"
              min="1"
              max="120"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Puberty background
            </Label>
            <Select value={pubertyBackground} onValueChange={setPubertyBackground}>
              <SelectTrigger
                aria-label="Puberty background"
                className="h-11 rounded-[2px] border border-border bg-white font-semibold shadow-none"
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_puberty_voice">Pre-puberty voice</SelectItem>
                <SelectItem value="post_puberty_voice">Post-puberty voice</SelectItem>
                <SelectItem value="transitioning_voice_change">
                  Transitioning / voice change in progress
                </SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSave} className="h-11 w-full md:w-auto md:px-8">
          <Save className="h-4 w-4" />
          Save personalization
        </Button>
      </div>
    </section>
  );
}
