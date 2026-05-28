import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileSettings from "@/components/profile/ProfileSettings";
import ProfileExtension from "@/components/profile/ProfileExtension";
import VoiceInput from "@/components/profile/VoiceInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UserProfile = Record<string, unknown>;
type SaveHandler = () => Promise<boolean>;
type AppLayoutContext = {
  user: UserProfile;
  updateUser?: (updates: Record<string, unknown>) => Promise<void>;
};

export default function Profile() {
  const { user, updateUser } = useOutletContext<AppLayoutContext>();
  const navigate = useNavigate();
  const [isTrainingDirty, setIsTrainingDirty] = useState(false);
  const [isBackgroundDirty, setIsBackgroundDirty] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isDialogSaving, setIsDialogSaving] = useState(false);
  const trainingSaveRef = useRef<SaveHandler>(async () => true);
  const backgroundSaveRef = useRef<SaveHandler>(async () => true);
  const allowNavigationRef = useRef(false);
  const hasUnsaved = isTrainingDirty || isBackgroundDirty;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsaved || allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsaved]);

  useEffect(() => {
    const handleDocumentClick = (event: Event) => {
      if (!hasUnsaved) return;
      const eventTarget = event.target;
      const target = eventTarget instanceof Element ? eventTarget.closest("a[href]") : null;
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      if (href === window.location.pathname) return;
      event.preventDefault();
      setPendingPath(href);
      setShowLeaveDialog(true);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [hasUnsaved]);

  const continueNavigation = (path: string | null) => {
    if (!path) return;
    allowNavigationRef.current = true;
    navigate(path);
  };

  const handleSaveAndLeave = async () => {
    if (isDialogSaving) return;
    setIsDialogSaving(true);
    try {
      const actions: Promise<boolean>[] = [];
      if (isTrainingDirty) actions.push(trainingSaveRef.current());
      if (isBackgroundDirty) actions.push(backgroundSaveRef.current());
      const results = await Promise.all(actions);
      if (results.every(Boolean)) {
        continueNavigation(pendingPath);
      }
      setShowLeaveDialog(false);
      setPendingPath(null);
    } finally {
      setIsDialogSaving(false);
    }
  };

  const handleDiscardAndLeave = () => {
    continueNavigation(pendingPath);
    setShowLeaveDialog(false);
    setPendingPath(null);
  };

  const handleCancelLeave = () => {
    setShowLeaveDialog(false);
    setPendingPath(null);
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-10">
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">User dossier</p>
          <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">Profile</h1>
          <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
            Manage the training profile used by the recorder.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
          >
            <ProfileCard user={user} />
            <VoiceInput user={user} onUpdate={updateUser} />
          </motion.div>

          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
          >
            <ProfileSettings
              user={user}
              onUpdate={updateUser}
              onDirtyChange={setIsTrainingDirty}
              registerSaveHandler={(fn: SaveHandler) => {
                trainingSaveRef.current = fn;
              }}
            />
            <ProfileExtension
              user={user}
              onUpdate={updateUser}
              onDirtyChange={setIsBackgroundDirty}
              registerSaveHandler={(fn: SaveHandler) => {
                backgroundSaveRef.current = fn;
              }}
            />
          </motion.div>
        </div>
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved profile changes. Save before leaving this page?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardAndLeave}>Discard changes</AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndLeave} disabled={isDialogSaving}>
              {isDialogSaving ? "Saving..." : "Save changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
