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
        className="fixed bottom-4 right-4 w-9 h-9 rounded-full bg-neutral-900 text-white text-sm shadow-lg z-40 hover:bg-neutral-700 transition"
        title="How Lobby works"
      >
        ?
      </button>
    </>
  );
}
