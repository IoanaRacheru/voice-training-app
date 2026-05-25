// @ts-nocheck

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { sessionService } from "@/services/sessionService";

export default function ProfileCard({ user }) {
  const [sessionCount, setSessionCount] = useState(() =>
    Math.max(user?.total_sessions || 0, sessionService.getSessionCount())
  );
  const displayName = user?.username || user?.id || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const goalLabels = {
    feminize: "Feminine",
    feminine: "Feminine",
    masculinize: "Masculine",
    masculine: "Masculine",
    androgynous: "Androgynous",
    custom: "Custom",
  };
  const goal = goalLabels[user?.voice_goal] || "Feminine";
  const level = user?.experience_level || "beginner";

  useEffect(() => {
    const updateSessionCount = () => {
      setSessionCount(Math.max(user?.total_sessions || 0, sessionService.getSessionCount()));
    };

    updateSessionCount();
    window.addEventListener("voiceSessions:changed", updateSessionCount);
    window.addEventListener("storage", updateSessionCount);

    return () => {
      window.removeEventListener("voiceSessions:changed", updateSessionCount);
      window.removeEventListener("storage", updateSessionCount);
    };
  }, [user?.total_sessions]);

  return (
    <section className="bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.06)]">
      <p className="font-mono text-[11px] uppercase text-muted-foreground">
        Identification
      </p>

      <div className="mt-5 flex items-start gap-4">
        <Avatar className="h-16 w-16 border border-border bg-background">
          <AvatarFallback className="bg-background text-xl font-black text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <h2 className="text-2xl font-black uppercase leading-tight text-foreground">
            {displayName}
          </h2>
          <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
            {user?.email || "No email available"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Badge className="border-border bg-background text-foreground">
          {goal}
        </Badge>
        <Badge className="border-border bg-background text-muted-foreground capitalize">
          {level}
        </Badge>
      </div>

      <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-border pt-5 text-center">
        <div>
          <dt className="text-[10px] font-bold uppercase text-muted-foreground">
            Streak
          </dt>
          <dd className="mt-1 text-2xl font-black">{user?.streak_days || 0}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-muted-foreground">
            Exercises
          </dt>
          <dd className="mt-1 text-2xl font-black">
            {user?.completed_exercises || 0}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-muted-foreground">
            Sessions
          </dt>
          <dd className="mt-1 text-2xl font-black">{sessionCount}</dd>
        </div>
      </dl>
    </section>
  );
}
