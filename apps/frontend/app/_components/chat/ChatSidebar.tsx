"use client";

import React from "react";
import LogoutButton from "@/app/_components/GoogleButton/logout";
import {
  PrimaryButton,
  MenuButton,
  MenuOption,
} from "@/app/_components/buttons";
import styles from "@/app/chat/page.module.css";

interface Chat {
  id: string;
  title: string;
}

interface ChatSidebarProps {
  chats: Chat[];
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
    <aside className={`${styles.sidebar} ${showSidebar ? styles.open : ''}`}>
      <PrimaryButton onClick={onCreateChat}>
        チャット新規作成
      </PrimaryButton>
      <div className={styles.chatListContainer}>
        {chats.map((c) => (
          <div
            key={c.id}
            className={`${styles.chatItemContainer} ${c.id === selectedChat ? styles.active : ''}`}
          >
            <div
              className={styles.chatItemTitle}
              onClick={() => onSelectChat(c.id)}
            >
              {c.title}
            </div>
            <div className={styles.chatMenuButtonContainer}>
              <MenuButton
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMenu(c.id);
                }}
              >
                ⋯
              </MenuButton>
              {openMenuChatId === c.id && (
                <div className={styles.chatMenuDropdown}>
                  <MenuOption
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditChat(c.id, c.title);
                    }}
                  >
                    編集
                  </MenuOption>
                  <MenuOption
                    isDelete={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(c.id);
                    }}
                  >
                    削除
                  </MenuOption>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <LogoutButton />
      </div>
    </aside>
  );
}



