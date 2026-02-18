"use client";

import React from "react";

interface SelectedTag {
  title: string;
  isSystemTag?: boolean;
}

interface SelectedTagsDisplayProps {
  tags: SelectedTag[];
  onRemoveTag: (tag: string) => void;
}

export default function SelectedTagsDisplay({
  tags,
  onRemoveTag,
}: SelectedTagsDisplayProps) {
  if (tags.length === 0) return null;

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#666" }}>
        選択済みタグ ({tags.length})
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.map((tag) => (
          <div
            key={tag.title}
            style={{
              padding: "6px 12px",
              background: "#4CAF50",
              color: "#fff",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {tag.title}
            <button
              onClick={() => onRemoveTag(tag.title)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

