// @ts-nocheck

import React from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileSettings from "@/components/profile/ProfileSettings";
import ProgressSection from "@/components/profile/ProgressSection";
import ProfileExtension from "@/components/profile/ProfileExtension";
import VoiceInput from "@/components/profile/VoiceInput";

export default function Profile() {
  const { user, updateUser } = useOutletContext();

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">
          User dossier
        </p>
        <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">
          Profile
        </h1>
        <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
          Manage the training profile used by the recorder.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_1fr]">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
        >
          <ProfileCard user={user} />
          <ProgressSection user={user} />
        </motion.div>

        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 }}
        >
          <ProfileSettings user={user} onUpdate={updateUser} />
          <ProfileExtension user={user} onUpdate={updateUser} />
          <VoiceInput user={user} onUpdate={updateUser} />
        </motion.div>
      </div>
    </div>
  );
}
