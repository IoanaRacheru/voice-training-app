import { motion } from "framer-motion";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { getTutorialById, tutorials } from "@/data/tutorials";

export default function Tutorials() {
  const { tutorialId } = useParams();
  const selectedTutorial = tutorialId ? getTutorialById(tutorialId) : null;

  if (tutorialId && !selectedTutorial) {
    return <Navigate to="/tutorials" replace />;
  }

  if (selectedTutorial) {
    const index = tutorials.findIndex((tutorial) => tutorial.id === selectedTutorial.id);
    const previous = index > 0 ? tutorials[index - 1] : null;
    const next = index < tutorials.length - 1 ? tutorials[index + 1] : null;

    return (
      <div className="mx-auto max-w-5xl space-y-8" data-testid="page-tutorial-detail">
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            to="/tutorials"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to tutorials
          </Link>
          <p className="mt-4 mb-2 font-mono text-[11px] uppercase text-muted-foreground">Gender voice training</p>
          <h1 className="font-display text-4xl uppercase leading-[0.95] text-foreground md:text-6xl">{selectedTutorial.title}</h1>
          <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-muted-foreground">{selectedTutorial.subtitle}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold uppercase text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {selectedTutorial.readTime}
            </span>
            <span className="bg-card px-2 py-1">{selectedTutorial.level}</span>
          </div>
        </motion.header>

        <div className="space-y-5">
          {selectedTutorial.sections.map((section) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-6 shadow-[0_18px_50px_rgba(105,79,93,0.05)]"
            >
              <h2 className="text-2xl font-black uppercase text-foreground">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm font-medium leading-7 text-foreground/90">
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.bullets?.length ? (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="text-sm font-semibold leading-6 text-muted-foreground">
                      • {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.section>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {previous ? (
            <Link
              to={`/tutorials/${previous.id}`}
              className="border border-border bg-card p-4 text-foreground hover:border-primary"
            >
              <span className="block text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Previous</span>
              <p className="mt-2 text-sm font-black uppercase leading-5">{previous.title}</p>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              to={`/tutorials/${next.id}`}
              className="border border-border bg-card p-4 text-right text-foreground hover:border-primary"
            >
              <span className="block text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Next</span>
              <span className="mt-2 inline-flex items-center justify-end gap-2">
                <span className="text-sm font-black uppercase leading-5">{next.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10" data-testid="page-tutorials">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">Learning hub</p>
        <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">Tutorials</h1>
        <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
          Structured reading guides about gender voice training. These are educational modules, not active exercises.
        </p>
      </motion.header>

      <div className="grid gap-5 md:grid-cols-2">
        {tutorials.map((tutorial, index) => (
          <motion.article
            key={tutorial.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * index }}
            className="border border-border bg-card p-6 shadow-[0_24px_70px_rgba(105,79,93,0.08)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase text-muted-foreground">{tutorial.level}</p>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">{tutorial.readTime}</p>
            </div>
            <h2 className="mt-3 text-2xl font-black uppercase text-foreground">{tutorial.title}</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{tutorial.subtitle}</p>
            <Link
              to={`/tutorials/${tutorial.id}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase text-primary hover:text-foreground"
            >
              Read tutorial
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
