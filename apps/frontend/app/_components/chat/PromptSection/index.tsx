"use client";

import React from "react";
import { SendButton } from "@/app/_components/buttons";
import styles from "./PromptSection.module.css";

interface PromptSectionProps {
  prompt: string;
  loading: boolean;
  onPromptChange: (value: string) => void;
  onSendPrompt: () => void;
}

export default function PromptSection({
  prompt,
  loading,
  onPromptChange,
  onSendPrompt,
}: PromptSectionProps) {
  return (
    <div className={styles.promptSection}>
      <label className={styles.promptLabel}>
        <img
          src="/状況.png"
          alt="状況アイコン"
          className={styles.promptIcon}
        />
        今の状況をAIに相談してみましょう
      </label>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        className={styles.promptTextarea}
        placeholder="要望や状況を入力して AI に相談"
      />
      <div className={styles.promptButtonContainer}>
        <SendButton onClick={onSendPrompt} disabled={loading}>
          {loading ? "送信中..." : "送信"}
        </SendButton>
      </div>
    </div>
  );
}

