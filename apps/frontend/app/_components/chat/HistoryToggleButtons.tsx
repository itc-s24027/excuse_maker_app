"use client";

import React from "react";
import styles from "@/app/chat/page.module.css";

interface AnswerGroup {
  promptId: string;
  prompt: string;
  answers: Array<{ text: string; deleted: boolean; success: boolean; excuseId: string }>;
  currentIndex: number;
}

interface HistoryToggleButtonsProps {
  answerHistory: AnswerGroup[];
  currentAnswerGroup: AnswerGroup | null;
  showSuccessHistory: boolean;
  showHiddenAnswers: Record<string, boolean>;
  selectedChat: string | null;
  onToggleSuccessHistory: () => void;
  onToggleHiddenAnswers: () => void;
}

export default function HistoryToggleButtons({
  answerHistory,
  currentAnswerGroup,
  showSuccessHistory,
  showHiddenAnswers,
  selectedChat,
  onToggleSuccessHistory,
  onToggleHiddenAnswers,
}: HistoryToggleButtonsProps) {
  const successCount = answerHistory.filter(g => g.answers.some(a => a.success && !a.deleted)).length;
  const hasHiddenAnswers = currentAnswerGroup && currentAnswerGroup.answers.some(a => a.deleted);

  return (
    <div className={styles.historyToggleContainer}>
      <button
        onClick={onToggleSuccessHistory}
        disabled={successCount === 0}
        className={`${styles.historyToggleButton} ${successCount > 0 ? styles.success : ''}`}
      >
        成功一覧
      </button>
      <button
        onClick={onToggleHiddenAnswers}
        disabled={!hasHiddenAnswers}
        className={`${styles.historyToggleButton} ${hasHiddenAnswers ? styles.hidden : ''}`}
      >
        {showHiddenAnswers[selectedChat!] ? "非表示一覧" : "非表示一覧"}
      </button>
    </div>
  );
}

