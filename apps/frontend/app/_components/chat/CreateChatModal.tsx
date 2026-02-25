"use client";

import React, { useState } from "react";
import { CreateModalButton } from "@/app/_components/buttons";
import styles from "@/app/chat/page.module.css";

interface CreateModalProps {
  isOpen: boolean;
  isFirstChat: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  onAlert: (message: string) => void;
}

export default function CreateChatModal({
  isOpen,
  isFirstChat,
  onClose,
  onCreate,
  onAlert,
}: CreateModalProps) {
  const [title, setTitle] = useState("");

  if (!isOpen) return null;

  const submit = () => {
    if (!title.trim()) {
      onAlert("タイトルを入力してください");
      return;
    }
    onCreate(title);
    setTitle("");
  };

  const handleCancel = () => {
    setTitle("");
    onClose();
  };

  return (
    <div className={styles.createModalOverlay}>
      <div className={styles.createModalContent}>
        <h2 className={styles.createModalTitle}>新しいチャットを作成しましょう！</h2>
        <p className={styles.createModalSubtitle}>
          {isFirstChat ? "タイトルを入力してください" : "タイトルを入力してください。"}
        </p>
        <div className={styles.createModalInputContainer}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.createModalInput}
            placeholder="例: 課題が終わらない"
            autoFocus
          />
        </div>
        <div className={styles.createModalButtonsContainer}>
          <CreateModalButton
            variant="cancel"
            onClick={handleCancel}
          >
            {isFirstChat ? "キャンセル" : "キャンセル"}
          </CreateModalButton>
          <CreateModalButton
            variant="submit"
            onClick={submit}
          >
            作成
          </CreateModalButton>
        </div>
      </div>
    </div>
  );
}

