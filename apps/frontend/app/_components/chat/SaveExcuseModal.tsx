"use client";

import React, { useState } from "react";
import TagSelector from "./TagSelector";
import SelectedTagsDisplay from "./SelectedTagsDisplay";

interface Tag {
  id?: string;
  title: string;
  isSystemTag?: boolean;
}

interface SaveExcuseModalProps {
  isOpen: boolean;
  excuseText: string;
  onClose: () => void;
  onSave: (selectedTags: Tag[]) => void;
  availableTags: Tag[];
  onTagsUpdated?: () => void;
}

export default function SaveExcuseModal({
  isOpen,
  excuseText,
  onClose,
  onSave,
  availableTags,
  onTagsUpdated,
}: SaveExcuseModalProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>(availableTags);

  // モーダルが開く時に初期状態を設定
  React.useEffect(() => {
    if (isOpen) {
      setAllTags(availableTags);
      setSelectedTags([]);
    }
  }, [isOpen, availableTags]);


  // タグ選択/解除
  const toggleTag = (tagTitle: string) => {
    setSelectedTags((prev) => {
      const exists = prev.find(t => t.title === tagTitle);
      if (exists) {
        return prev.filter(t => t.title !== tagTitle);
      } else {
        const tagObj = allTags.find(t => t.title === tagTitle) || { title: tagTitle };
        return [...prev, tagObj];
      }
    });
  };

  // 保存処理
  const handleSave = () => {
    onSave(selectedTags);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          width: "90%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#665440" }}>言い訳を保存</h2>
        </div>

        {/* 言い訳の内容表示 */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#666" }}>
            生成された言い訳
          </h3>
          <div
            style={{
              padding: 16,
              background: "#f5f5f5",
              borderRadius: 8,
              border: "1px solid #e0e0e0",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {excuseText}
          </div>
        </div>

        {/* タグ選択セクション */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#666" }}>
            タグ一覧
          </h3>
          <TagSelector
            availableTags={allTags}
            selectedTags={selectedTags.map(t => t.title)}
            onToggleTag={toggleTag}
          />
        </div>

        {/* 選択済みタグ表示 */}
        <div style={{ marginBottom: 20 }}>
          <SelectedTagsDisplay
            tags={selectedTags}
            onRemoveTag={toggleTag}
          />
        </div>

        {/* ボタン */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 24,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "#f0f0f0",
              color: "#333",
              border: "1px solid #ddd",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              background: "#4CAF50",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

