"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "lobby_welcome_seen";

const SLIDES = [
  {
    icon: "👋",
    title: "Welcome to Lobby",
    body: "Your community is more than a chat feed. Lobby shows you who's actually here — their interests, availability, and how to connect with them.",
    hint: "Think of it as the member wall your community never had.",
  },
  {
    icon: "🪪",
    title: "Your Profile Card",
    body: "This is how others see you. Add a bio, pick interest tags, and set a status line so people know what you're about.",
    hint: "The more you share, the easier it is to find your people.",
  },
  {
    icon: "🔍",
    title: "Discover & Connect",
    body: "Search by name or interest tag. Look for presence indicators — green rings mean someone is active right now, blue means they're open to chat.",
    hint: "Send a Wave to break the ice without committing to a full message.",
  },
  {
    icon: "🚀",
    title: "Boost Yourself",
    body: "Boost pins your profile to the spotlight for 2 hours. Tell the group why — maybe you're free for calls, looking for collaborators, or just want to say hi.",
    hint: "One boost per person per week. Use it when the timing feels right.",
  },
  {
    icon: "🤝",
    title: "Weekly Buddy Matching",
    body: "Opt in from your profile settings and you'll get randomly paired with someone new each week. It's the fastest way to meet people you wouldn't find on your own.",
    hint: "Your buddy stays hidden until you choose to reveal them.",
  },
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
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-modal"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="rounded-[24px] max-w-[400px] w-full overflow-hidden card-shadow"
        style={{ background: "var(--surface-raised)", color: "var(--text-primary)" }}
      >
        {/* Illustration area */}
        <div
          className="flex items-center justify-center py-10"
          style={{ background: "var(--surface-sunken)" }}
        >
          <span
            className="text-6xl select-none"
            style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))" }}
          >
            {slide.icon}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 pb-5">
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: "var(--font-jakarta)", color: "var(--text-primary)" }}
          >
            {slide.title}
          </h2>
          <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
            {slide.body}
          </p>
          <p className="text-xs italic mb-5" style={{ color: "var(--text-tertiary)" }}>
            {slide.hint}
          </p>

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 mb-5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className="h-[5px] rounded-full step-dot"
                style={{
                  width: i === step ? "24px" : "5px",
                  background: i === step ? "var(--accent)" : "var(--border-strong)",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5">
            {!isLast ? (
              <>
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="flex-1 rounded-[14px] py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Continue
                </button>
                <button
                  onClick={close}
                  className="rounded-[14px] px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-70"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Skip
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={goToProfile}
                  className="flex-1 rounded-[14px] py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Set up my profile →
                </button>
                <button
                  onClick={close}
                  className="rounded-[14px] px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-70"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Later
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
