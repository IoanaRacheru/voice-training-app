import { motion } from "framer-motion";

export default function Tutorials() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">Learning hub</p>
        <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">Tutorials</h1>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white p-10 text-center shadow-[0_24px_70px_rgba(17,17,17,0.08)]"
      >
        <p className="font-display text-4xl uppercase text-foreground">Coming Soon</p>
        <p className="mt-4 text-sm font-medium text-muted-foreground">Tutorials are currently in development.</p>
      </motion.section>
    </div>
  );
}

