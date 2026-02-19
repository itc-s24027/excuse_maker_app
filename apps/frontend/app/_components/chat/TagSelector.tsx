"use client";

import React from "react";

interface TagItem {
  title: string;
  isSystemTag?: boolean;
}

interface TagSelectorProps {
  availableTags: TagItem[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}

export default function TagSelector({
  availableTags,
  selectedTags,
  onToggleTag,
}: TagSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: 12,
        background: "#fafafa",
        borderRadius: 8,
        border: "1px solid #e0e0e0",
        minHeight: 40,
      }}
    >
      {availableTags.length > 0 ? (
        availableTags.map((tag, index) => (
          <button
            key={`${tag.title}-${index}`}
            onClick={() => onToggleTag(tag.title)}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              border: selectedTags.includes(tag.title)
                ? "2px solid #4CAF50"
                : "2px solid #ddd",
              background: selectedTags.includes(tag.title)
                ? "#e8f5e9"
                : "#fff",
              color: selectedTags.includes(tag.title) ? "#2e7d32" : "#666",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            title={tag.isSystemTag ? "システムタグ" : ""}
          >
            {tag.title}
          </button>
        ))
      ) : (
        <p style={{ color: "#999", fontSize: 13, margin: 0 }}>
          利用可能なタグがありません
        </p>
      )}
    </div>
  );
}

