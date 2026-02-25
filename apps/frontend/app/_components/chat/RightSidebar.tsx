"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/chat/page.module.css";

interface Tag {
  id?: string;
  title: string;
  isSystemTag?: boolean;
  userId?: string | null;
  user?: { id: string; nickname: string | null; email: string } | null;
  isDeleted?: boolean;
}

interface RightSidebarProps {
  tags: Tag[];
  selectedChat: string | null;
  showRightSidebar: boolean;
}

export default function RightSidebar({
  tags,
  selectedChat,
  showRightSidebar,
}: RightSidebarProps) {
  const router = useRouter();

  const handleTagClick = (tagId?: string) => {
    if (tagId) {
      router.push(`/tag-ranking/${tagId}`);
    }
  };

  return (
    <aside className={`${styles.rightSidebar} ${showRightSidebar ? styles.open : ''}`}>
      {selectedChat && tags.length > 0 ? (
        <div>
          <h4
            style={{
              fontSize: "0.9rem",
              fontWeight: "700",
              color: "#665440",
              marginBottom: "8px",
            }}
          >
            タグ一覧
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tags.map((t) => (
              <button
                key={t.id || t.title}
                onClick={() => handleTagClick(t.id)}
                style={{
                  background: "#fff",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #dfc9ab",
                  color: "#665440",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.25s ease",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "var(--font-noto-sans-jp)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#c3af96";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#665440";
                }}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
      ) : selectedChat ? (
        <p
          style={{
            fontSize: "0.85rem",
            color: "#9a6044",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          タグがありません
        </p>
      ) : null}
    </aside>
  );
}




