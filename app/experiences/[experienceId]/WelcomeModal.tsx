"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "lobby_welcome_seen";

export default function WelcomeModal({
  experienceId,
  hasProfile,
}: {
  experienceId: string;
  hasProfile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (hasProfile) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, [hasProfile]);

  function close() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  function goToProfile() {
    localStorage.setItem(STORAGE_KEY, "true");
    router.push(`/experiences/${experienceId}/profile`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Welcome to Lobby 👋</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Right now this community is just names scrolling past in chat. Lobby lets you actually
          see who else is here — search by interest, get matched with a weekly buddy, and message
          people you'd never have noticed otherwise.
        </p>
        <p className="text-sm text-neutral-600 mb-6">
          Takes 30 seconds: fill in a quick bio and pick a few tags, and you'll show up in the
          directory so others can find <em>you</em> too.
        </p>
        <div className="flex gap-2">
          <button
            onClick={goToProfile}
            className="flex-1 rounded-lg bg-black text-white py-2.5 text-sm font-medium hover:bg-neutral-800 transition"
          >
            Fill my profile
          </button>
          <button
            onClick={close}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:border-neutral-400 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
