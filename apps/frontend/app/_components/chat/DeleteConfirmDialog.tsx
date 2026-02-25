"use client";

import React from "react";
import { DialogButton } from "@/app/_components/buttons";
import styles from "@/app/chat/page.module.css";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  hasTaggedExcuses: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({
  isOpen,
  hasTaggedExcuses,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogContent}>
        <h3 className={styles.dialogTitle}>本当にチャットを削除しますか？</h3>
        {hasTaggedExcuses && (
          <p className={styles.dialogWarning}>
            ⚠️ ランキングに登録されている言い訳があります。本当に削除しますか？
          </p>
        )}
        <p className={styles.dialogMessage}>このアクションは取り消せません。</p>
        <div className={styles.dialogButtonsContainer}>
          <DialogButton variant="delete" onClick={onConfirm}>
            はい
          </DialogButton>
          <DialogButton variant="cancel" onClick={onCancel}>
            いいえ
          </DialogButton>
        </div>
      </div>
    </div>
  );
}

