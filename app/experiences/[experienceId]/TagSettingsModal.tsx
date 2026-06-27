"use client";

import { useState, useTransition } from "react";
import {
  TagOption,
  addTagOption,
  renameTagOption,
  deactivateTagOption,
  reactivateTagOption,
  reorderTagOptions,
  resetTagsToDefault
} from "./tag-actions";

export default function TagSettingsModal({
  experienceId,
  initialInterests,
  initialCoordination,
  onClose,
}: {
  experienceId: string;
  initialInterests: TagOption[];
  initialCoordination: TagOption[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"interest" | "coordination">("interest");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Local state for optimistic updates / editing
  const [interests, setInterests] = useState(initialInterests);
  const [coordination, setCoordination] = useState(initialCoordination);

  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showRemoved, setShowRemoved] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "remove" | "reset"; tag?: TagOption } | null>(null);

  const currentList = tab === "interest" ? interests : coordination;
  const setList = tab === "interest" ? setInterests : setCoordination;

  const activeTags = currentList.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const removedTags = currentList.filter(t => !t.is_active);

  function wrapAction(fn: () => Promise<{ error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fn();
        if (res && res.error) setError(res.error);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const label = newLabel;
    setNewLabel("");
    
    wrapAction(async () => {
      const res = await addTagOption(experienceId, tab, label);
      if (res.error) return res;
      // Optimistic update would be complex without an ID, so we wait for server to revalidate or reload
      window.location.reload(); 
    });
  }

  function handleSaveEdit(tag: TagOption) {
    if (!editValue.trim() || editValue === tag.label) {
      setEditingId(null);
      return;
    }
    
    const oldLabel = tag.label;
    const newLbl = editValue;
    setEditingId(null);
    
    // Optimistic
    setList(prev => prev.map(t => t.id === tag.id ? { ...t, label: newLbl } : t));

    wrapAction(async () => {
      const res = await renameTagOption(experienceId, tag.id, oldLabel, newLbl, tab);
      if (res?.error) {
        // Revert
        setList(prev => prev.map(t => t.id === tag.id ? { ...t, label: oldLabel } : t));
        return res;
      }
    });
  }

  function handleDeactivate(tag: TagOption) {
    setConfirmAction({ type: "remove", tag });
  }

  function handleReactivate(tag: TagOption) {
    setList(prev => prev.map(t => t.id === tag.id ? { ...t, is_active: true } : t));
    wrapAction(async () => {
      const res = await reactivateTagOption(experienceId, tag.id);
      if (res?.error) {
        setList(prev => prev.map(t => t.id === tag.id ? { ...t, is_active: false } : t));
        return res;
      }
    });
  }

  function move(index: number, direction: -1 | 1) {
    if (index + direction < 0 || index + direction >= activeTags.length) return;
    
    const newActive = [...activeTags];
    const temp = newActive[index];
    newActive[index] = newActive[index + direction];
    newActive[index + direction] = temp;
    
    // Update local sort orders
    newActive.forEach((t, i) => t.sort_order = i);
    
    // Merge into full list
    setList(prev => {
      const copy = [...prev];
      newActive.forEach(at => {
        const idx = copy.findIndex(t => t.id === at.id);
        if (idx !== -1) copy[idx] = at;
      });
      return copy;
    });

    wrapAction(async () => {
      await reorderTagOptions(experienceId, tab, newActive.map(t => t.id));
    });
  }

  function handleReset() {
    setConfirmAction({ type: "reset" });
  }

  function confirmPendingAction() {
    if (!confirmAction) return;

    if (confirmAction.type === "remove" && confirmAction.tag) {
      const tag = confirmAction.tag;
      setConfirmAction(null);
      setList(prev => prev.map(t => t.id === tag.id ? { ...t, is_active: false } : t));

      wrapAction(async () => {
        const res = await deactivateTagOption(experienceId, tag.id, tag.label, tab);
        if (res?.error) {
          setList(prev => prev.map(t => t.id === tag.id ? { ...t, is_active: true } : t));
          return res;
        }
      });
      return;
    }

    setConfirmAction(null);
    wrapAction(async () => {
      const res = await resetTagsToDefault(experienceId, tab);
      if (res?.error) return res;
      window.location.reload();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-modal" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div 
        className="w-full max-w-lg rounded-[24px] card-shadow flex flex-col max-h-[85vh] overflow-hidden"
        style={{ background: "var(--surface-raised)" }}
      >
        {confirmAction && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-modal" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="w-full max-w-sm rounded-[24px] p-5 card-shadow" style={{ background: "var(--surface-raised)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {confirmAction.type === "reset" ? "Reset tags to defaults?" : `Remove "${confirmAction.tag?.label ?? "tag"}"?`}
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                {confirmAction.type === "reset"
                  ? "This will remove all custom tags and restore the default list."
                  : "This will remove this tag from all users' profiles."}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={isPending}
                  className="rounded-[12px] px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
                  style={{ background: "var(--surface-sunken)", color: "var(--text-primary)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPendingAction}
                  disabled={isPending}
                  className="rounded-[12px] px-3 py-2 text-sm font-semibold transition-opacity disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {confirmAction.type === "reset" ? "Reset to defaults" : "Remove tag"}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}>
            Tag Settings
          </h2>
          <button onClick={onClose} className="text-2xl hover:opacity-70 transition-opacity" style={{ color: "var(--text-secondary)" }}>
            &times;
          </button>
        </div>

        <div className="flex px-6 pt-4 gap-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            onClick={() => setTab("interest")}
            className="pb-3 text-sm font-semibold transition-colors"
            style={{ 
              color: tab === "interest" ? "var(--text-primary)" : "var(--text-secondary)",
              borderBottom: tab === "interest" ? "2px solid var(--accent)" : "2px solid transparent"
            }}
          >
            Interest Tags
          </button>
          <button
            onClick={() => setTab("coordination")}
            className="pb-3 text-sm font-semibold transition-colors"
            style={{ 
              color: tab === "coordination" ? "var(--text-primary)" : "var(--text-secondary)",
              borderBottom: tab === "coordination" ? "2px solid var(--accent)" : "2px solid transparent"
            }}
          >
            Current Goals (Coordination)
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "var(--surface-sunken)", color: "var(--error)", border: "1px solid var(--error)" }}>
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>
              Active Tags ({activeTags.length}/30)
            </span>
            <button onClick={handleReset} className="text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
              Reset to defaults
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            {activeTags.map((tag, i) => (
              <div 
                key={tag.id}
                className="flex items-center gap-2 p-2 rounded-[12px] border group"
                style={{ background: "var(--surface-base)", borderColor: "var(--border-subtle)" }}
              >
                <div className="flex flex-col gap-0.5 px-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button disabled={i === 0 || isPending} onClick={() => move(i, -1)} className="hover:text-black dark:hover:text-white disabled:opacity-30">▲</button>
                  <button disabled={i === activeTags.length - 1 || isPending} onClick={() => move(i, 1)} className="hover:text-black dark:hover:text-white disabled:opacity-30">▼</button>
                </div>
                
                {editingId === tag.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveEdit(tag)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(tag)}
                    className="flex-1 text-sm bg-transparent outline-none border-b"
                    style={{ color: "var(--text-primary)", borderColor: "var(--accent)" }}
                  />
                ) : (
                  <span 
                    onClick={() => { setEditingId(tag.id); setEditValue(tag.label); }}
                    className="flex-1 text-sm cursor-text hover:opacity-80 truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {tag.label}
                  </span>
                )}

                <button
                  onClick={() => handleDeactivate(tag)}
                  disabled={isPending}
                  className="px-2 py-1 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Remove
                </button>
              </div>
            ))}
            {activeTags.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>No active tags in this category.</p>
            )}
          </div>

          <form onSubmit={handleAdd} className="flex gap-2 mb-8">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Add a new tag..."
              maxLength={40}
              className="flex-1 rounded-[12px] px-3 py-2 text-sm outline-none border transition-colors"
              style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
              onFocus={(e) => e.target.style.borderColor = "var(--border-strong)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
            />
            <button
              type="submit"
              disabled={!newLabel.trim() || isPending || activeTags.length >= 30}
              className="px-4 rounded-[12px] text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Add
            </button>
          </form>

          {removedTags.length > 0 && (
            <div>
              <button
                onClick={() => setShowRemoved(!showRemoved)}
                className="text-xs font-bold tracking-widest uppercase flex items-center gap-2 mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Removed Tags ({removedTags.length}) {showRemoved ? "▼" : "▶"}
              </button>
              
              {showRemoved && (
                <div className="flex flex-wrap gap-2">
                  {removedTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleReactivate(tag)}
                      disabled={isPending}
                      className="text-xs px-2.5 py-1 rounded-full border border-dashed transition-opacity hover:opacity-80"
                      style={{ 
                        background: "var(--surface-base)", 
                        borderColor: "var(--border-strong)", 
                        color: "var(--text-secondary)" 
                      }}
                      title="Click to restore"
                    >
                      {tag.label} +
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
