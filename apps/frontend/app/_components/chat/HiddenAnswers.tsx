"use client";

import React from "react";
import styles from "@/app/chat/page.module.css";

interface Answer {
  text: string;
  deleted: boolean;
  success: boolean;
  excuseId: string;
  tags?: Array<{ excuseId: string; tagId: string; tag?: { id: string; title: string } }>;
}

interface AnswerGroup {
  promptId: string;
  prompt: string;
  answers: Answer[];
  currentIndex: number;
}

interface HiddenAnswersProps {
  show: boolean;
  answerHistory: AnswerGroup[];
  currentGroupIdx: number;
  onSelectGroup: (groupIdx: number) => void;
  onCancelHide?: (groupIdx: number, answerIdx: number) => void;
}

export default function HiddenAnswers({
  show,
  answerHistory,
  currentGroupIdx,
  onSelectGroup,
  onCancelHide,
}: HiddenAnswersProps) {
  if (!show || answerHistory.length === 0) return null;

  return (
    <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
      <div className={styles.historyScrollContainer}>
        {answerHistory.map((group, idx) => {
          const hiddenAnswers = group.answers.filter((a) => a.deleted);
          return hiddenAnswers.length > 0
            ? hiddenAnswers.map((hiddenAnswer, ansIdx) => (
                <div
                  key={`${idx}-${ansIdx}`}
                  onClick={() => onSelectGroup(idx)}
                  className={`${styles.historyCard} ${idx === currentGroupIdx ? styles.active : ''}`}
                  style={{
                    background:
                      idx === currentGroupIdx ? "#c87960" : "#fff",
                    color: idx === currentGroupIdx ? "#fff" : "#c87960",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCancelHide) {
                        onCancelHide(idx, ansIdx);
                      }
                    }}
                    className={styles.historyCardCloseButton}
                  >
                    ✕
                  </button>
                  <div className={styles.historyCardTitle}>
                    <strong></strong> {group.prompt.substring(0, 35)}
                  </div>
                  <div className={styles.historyCardSubtitle}>
                    <strong></strong> {hiddenAnswer.text.substring(0, 80)}
                  </div>
                </div>
              ))
            : null;
        })}
      </div>
    </div>
  );
}


