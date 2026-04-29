import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProfileCard from '@/components/profile/ProfileCard';
import ProfileSettings from '@/components/profile/ProfileSettings';
import ProgressSection from '@/components/profile/ProgressSection';

export default function Profile() {
  /** @type {{ user: any; setUser: (user: any) => void }} */
  const { user, setUser } = useOutletContext();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your voice training preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <motion.div
          className="lg:col-span-1 space-y-6"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ProfileCard user={user} />
          <ProgressSection user={user} />
        </motion.div>

        {/* Right column */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ProfileSettings user={user} onUpdate={setUser} />
        </motion.div>
      </div>
    </div>
  );
}