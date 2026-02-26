"use client";
import React, { useState } from "react";
import LogoutButton from "@/app/_components/GoogleButton/logout";
import { ChatSummary } from "@/app/api/chat";
import styles from "./ChatSidebar.module.css";

interface ChatSidebarProps {
  chats: ChatSummary[];
  selectedChat: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onEditChat: (chatId: string, title: string) => void;
  onDeleteChat: (chatId: string) => void;
  openMenuChatId: string | null;
  onToggleMenu: (chatId: string) => void;
  showSidebar: boolean;
}

export default function ChatSidebar({
  chats,
  selectedChat,
  onSelectChat,
  onCreateChat,
  onEditChat,
  onDeleteChat,
  openMenuChatId,
  onToggleMenu,
  showSidebar,
}: ChatSidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${showSidebar ? styles.show : ''}`}>
      <div className={styles.sidebarHeader}>
        <h2>チャット</h2>
      </div>

      <button onClick={onCreateChat} className={styles.newChatButton}>
        ＋ 新規
      </button>

      <div className={styles.chatList}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`${styles.chatItem} ${selectedChat === chat.id ? styles.active : ''}`}
          >
            <button
              onClick={() => onSelectChat(chat.id)}
              className={styles.chatButton}
            >
              {chat.title}
            </button>
            <button
              onClick={() => onToggleMenu(chat.id)}
              className={styles.menuButton}
            >
              ⋯
            </button>
            {openMenuChatId === chat.id && (
              <div className={styles.menu}>
                <button
                  onClick={() => onEditChat(chat.id, chat.title)}
                  className={styles.menuItem}
                >
                  編集
                </button>
                <button
                  onClick={() => onDeleteChat(chat.id)}
                  className={styles.menuItem}
                >
                  削除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.logoutContainer}>
        <LogoutButton />
      </div>
    </aside>
  );
}

