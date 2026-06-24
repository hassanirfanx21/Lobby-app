"use client";

import { useEffect, useState } from "react";
import { ChatElement, ChatSession, Elements } from "@whop/embedded-components-react-js";
import { loadWhopElements } from "@whop/embedded-components-vanilla-js";
import { getOrCreateDmChannel } from "./chat-actions";

const elements = loadWhopElements();

export default function ChatModal({
  experienceId,
  otherUserId,
  otherName,
  onClose,
}: {
  experienceId: string;
  otherUserId: string;
  otherName: string;
  onClose: () => void;
}) {
  const [channelId, setChannelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateDmChannel(experienceId, otherUserId)
      .then((res) => setChannelId(res.channelId))
      .catch((err) => setError(err.message ?? "Couldn't open chat."));
  }, [experienceId, otherUserId]);

  async function getToken() {
    const res = await fetch("/api/chat-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experienceId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to get chat token");
    return data.token;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full h-[70vh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <p className="font-medium text-neutral-900">{otherName}</p>
          <button onClick={onClose} className="text-sm text-neutral-500">✕</button>
        </div>
        <div className="flex-1 overflow-hidden">
          {error && <p className="p-4 text-sm text-red-600">{error}</p>}
          {!error && !channelId && <p className="p-4 text-sm text-neutral-400">Opening chat...</p>}
          {channelId && (
            <Elements elements={elements}>
              <ChatSession token={getToken}>
                <ChatElement options={{ channelId }} style={{ height: "100%", width: "100%" }} />
              </ChatSession>
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
