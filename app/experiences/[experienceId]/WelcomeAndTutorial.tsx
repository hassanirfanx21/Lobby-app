"use client";
import { useState } from "react";
import WelcomeModal from "./WelcomeModal";

export default function WelcomeAndTutorial({
  experienceId,
  hasProfile,
}: {
  experienceId: string;
  hasProfile: boolean;
}) {
  const [forceOpen, setForceOpen] = useState(false);
  return (
    <>
      <WelcomeModal experienceId={experienceId} hasProfile={hasProfile} forceOpen={forceOpen} onClose={() => setForceOpen(false)} />
      <button
        onClick={() => setForceOpen(true)}
        className="fixed bottom-5 right-5 w-10 h-10 rounded-full text-sm z-40 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center font-bold"
        style={{
          background: "var(--surface-raised)",
          color: "var(--text-secondary)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1), 0 0 0 1px var(--border-subtle)",
        }}
        title="How Lobby works"
      >
        ?
      </button>
    </>
  );
}
