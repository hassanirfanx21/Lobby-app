"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "lobby_welcome_seen";

const SLIDES = [
  { title: "Welcome to Lobby 👋", body: "Right now this community is just names scrolling past in chat. Lobby lets you actually see who else is here." },
  { title: "Search & Badges 🔍", body: "Search the directory by name or interest tag. Look for 🆕 New, ⭐ OG, and ✅ Verified badges on people's cards." },
  { title: "Wave & Buddy Match 👋🤝", body: "Send a quick Wave to break the ice, or opt into weekly Buddy Matching to get randomly paired with someone new." },
  { title: "You're in control 🔒", body: "Toggle who can message you anytime, and your weekly buddy stays hidden until you choose to reveal them." },
];

export default function WelcomeModal({
  experienceId,
  hasProfile,
  forceOpen,
  onClose,
}: {
  experienceId: string;
  hasProfile: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      return;
    }
    if (hasProfile) return;
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, [hasProfile, forceOpen]);

  function close() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    onClose?.();
  }

  function goToProfile() {
    localStorage.setItem(STORAGE_KEY, "true");
    router.push(`/experiences/${experienceId}/profile`);
  }

  if (!open) return null;
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">{slide.title}</h2>
        <p className="text-sm text-neutral-600 mb-6">{slide.body}</p>
        <div className="flex justify-center gap-1.5 mb-4">
          {SLIDES.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-black" : "w-1.5 bg-neutral-200"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {!isLast ? (
            <>
              <button onClick={() => setStep((s) => s + 1)} className="flex-1 rounded-lg bg-black text-white py-2.5 text-sm font-medium hover:bg-neutral-800 transition">Next</button>
              <button onClick={close} className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:border-neutral-400 transition">Skip</button>
            </>
          ) : (
            <>
              <button onClick={goToProfile} className="flex-1 rounded-lg bg-black text-white py-2.5 text-sm font-medium hover:bg-neutral-800 transition">Fill my profile</button>
              <button onClick={close} className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:border-neutral-400 transition">Maybe later</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
