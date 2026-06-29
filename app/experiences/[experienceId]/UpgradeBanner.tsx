"use client";

import { createUpgradeCheckout } from "./billing-actions";

export function UpgradeBanner({
  experienceId,
  profileCount,
}: {
  experienceId: string;
  profileCount: number;
}) {
  async function handleClick() {
    const url = await createUpgradeCheckout(
      experienceId,
      `${window.location.origin}/experiences/${experienceId}`
    );
    window.open(url, "_blank");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-[14px] px-4 py-3 font-semibold transition hover:brightness-110"
      style={{ background: "var(--accent)", color: "#fff" }}
    >
      {profileCount >= 50
        ? `Upgrade to Lobby Pro — $19/mo (${profileCount} profiles)`
        : "Upgrade to Lobby Pro — $19/mo"}
    </button>
  );
}
