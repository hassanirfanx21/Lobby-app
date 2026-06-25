"use client";
import { useState } from "react";
import { dismissProfileViews } from "./view-actions";

type View = { viewer_user_id: string; viewer_name: string | null };

export default function ProfileViewBanner({
  views,
  experienceId,
}: {
  views: View[];
  experienceId: string;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden || views.length === 0) return null;

  const uniqueNames = Array.from(
    new Map(views.map((v) => [v.viewer_user_id, v.viewer_name ?? "Someone"])).values()
  );

  return (
    <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 flex items-center justify-between">
      <span>👀 {uniqueNames.join(", ")} checked out your profile this week.</span>
      <button
        onClick={() => {
          setHidden(true);
          dismissProfileViews(experienceId);
        }}
        className="text-xs underline ml-3 whitespace-nowrap"
      >
        Dismiss
      </button>
    </div>
  );
}
