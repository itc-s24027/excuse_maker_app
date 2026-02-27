"use client";

import React, { useState, useEffect } from "react";
import { ModalButton } from "@/app/_components/buttons";
import styles from "@/app/chat/page.module.css";

interface EditTitleModalProps {
  isOpen: boolean;
  initialTitle: string;
  onCancel: () => void;
  onSubmit: (newTitle: string) => void;
}

export default function EditTitleModal({
  isOpen,
  initialTitle,
  onCancel,
  onSubmit,
}: EditTitleModalProps) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(title);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalTitle}>チャットタイトルを編集</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
          className={styles.modalInput}
          autoFocus
        />
        <div className={styles.modalButtonsContainer}>
          <ModalButton variant="cancel" onClick={onCancel}>
            キャンセル
          </ModalButton>
          <ModalButton variant="submit" onClick={handleSubmit}>
            更新
          </ModalButton>
        </div>
      </div>
    </div>
  );
}

