"use client";

import React from "react";

export default function BackButton() {
  return (
    <button
      type="button"
      onClick={() => history.back()}
      className="text-sm font-medium inline-flex items-center gap-2"
      style={{ color: "var(--text-secondary)" }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
      <span>Back</span>
    </button>
  );
}
