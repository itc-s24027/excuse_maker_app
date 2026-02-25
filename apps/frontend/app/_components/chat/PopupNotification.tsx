"use client";

import React from "react";
import { PopupButton } from "@/app/_components/buttons";
import styles from "@/app/chat/page.module.css";

interface PopupNotificationProps {
  isOpen: boolean;
  message: string | null;
  onClose: () => void;
}

export default function PopupNotification({
  isOpen,
  message,
  onClose,
}: PopupNotificationProps) {
  if (!isOpen || !message) return null;

  return (
    <>
      <div className={styles.popupContainer}>
        <p className={styles.popupMessage}>{message}</p>
        <div className={styles.popupButtonsContainer}>
          <PopupButton onClick={onClose}>OK</PopupButton>
        </div>
      </div>
      <div className={styles.popupOverlay} onClick={onClose} />
    </>
  );
}

