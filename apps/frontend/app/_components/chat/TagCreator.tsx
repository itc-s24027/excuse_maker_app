"use client";

import React, { useState } from "react";
import { apifetch } from "@/app/lib/apiClient";

interface TagCreatorProps {
  onTagCreated: (newTag: string) => void;
}

export default function TagCreator({ onTagCreated }: TagCreatorProps) {
  const [newTagTitle, setNewTagTitle] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTag = async () => {
    if (!newTagTitle.trim()) {
      setError("タグ名を入力してください");
      return;
    }

    setIsCreatingTag(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_URL) {
        throw new Error("API URLが未設定です");
      }

      const res = await apifetch(`${API_URL}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTagTitle }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`タグ作成失敗: ${text}`);
      }

      const data = await res.json();
      const newTag = data.tag?.title || newTagTitle;

      onTagCreated(newTag);
      setNewTagTitle("");
    } catch (err) {
      console.error("タグ作成エラー:", err);
      setError(err instanceof Error ? err.message : "タグ作成に失敗しました");
    } finally {
      setIsCreatingTag(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={newTagTitle}
          onChange={(e) => setNewTagTitle(e.target.value)}
          placeholder="新しいタグ名を入力"
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 13,
          }}
          disabled={isCreatingTag}
        />
        <button
          onClick={handleCreateTag}
          disabled={isCreatingTag}
          style={{
            padding: "10px 16px",
            background: "#2196F3",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: isCreatingTag ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            opacity: isCreatingTag ? 0.6 : 1,
          }}
        >
          {isCreatingTag ? "作成中..." : "作成"}
        </button>
      </div>
      {error && (
        <p style={{ color: "#d32f2f", fontSize: 12, margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

