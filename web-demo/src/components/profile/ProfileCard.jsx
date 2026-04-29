// @ts-nocheck

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Calendar } from "lucide-react";

/**
 * Displays the current user's profile summary.
 *
 * @param {{ user: any }} props
 */
export default function ProfileCard({ user }) {
  const displayName = user?.username || user?.id || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const goal =
    user?.voice_goal === "masculinize" ? "Masculinize" : "Feminize";

  const level = user?.experience_level || "beginner";

  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/10 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className="px-6 pb-6 -mt-10 relative">
        <Avatar className="w-20 h-20 border-4 border-card">
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="mt-3">
          <h2 className="text-xl font-bold text-foreground">{displayName}</h2>

          <p className="text-sm text-muted-foreground">
            {user?.email || "No email available"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {goal}
          </Badge>

          <Badge className="bg-accent/10 text-accent border-accent/20 capitalize">
            {level}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border/50">
          <div className="text-center">
            <Flame className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{user?.streak_days || 0}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>

          <div className="text-center">
            <Trophy className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold">
              {user?.completed_exercises || 0}
            </p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>

          <div className="text-center">
            <Calendar className="w-4 h-4 text-chart-4 mx-auto mb-1" />
            <p className="text-lg font-bold">{user?.total_sessions || 0}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
}