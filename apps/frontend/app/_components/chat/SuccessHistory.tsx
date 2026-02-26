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

interface SuccessHistoryProps {
  show: boolean;
  answerHistory: AnswerGroup[];
  currentGroupIdx: number;
  showHiddenAnswers: Record<string, boolean>;
  onSelectGroup: (groupIdx: number) => void;
  onToggleHiddenAnswers: () => void;
  onSaveExcuse?: (text: string, excuseId: string) => void;
  onCancelSuccess?: (groupIdx: number, answerIdx: number) => void;
}

export default function SuccessHistory({
  show,
  answerHistory,
  currentGroupIdx,
  showHiddenAnswers,
  onSelectGroup,
  onToggleHiddenAnswers,
  onSaveExcuse,
  onCancelSuccess,
}: SuccessHistoryProps) {
  if (!show || answerHistory.length === 0) return null;

  const successExists = answerHistory.some((g) =>
    g.answers.some((a) => a.success && !a.deleted)
  );

  if (!successExists) return null;

  return (
    <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
      <div className={styles.historyScrollContainer}>
        {answerHistory.map((group, idx) => {
          const successAnswers = group.answers.filter(
            (a) => a.success && !a.deleted
          );
          return successAnswers.length > 0
            ? successAnswers.map((successAnswer, ansIdx) => {
                // 元のgroup.answers内での正確なインデックスを取得
                const actualAnswerIndex = group.answers.indexOf(successAnswer);
                return (
                <div
                  key={`${idx}-${ansIdx}`}
                  onClick={() => onSelectGroup(idx)}
                  className={`${styles.historyCard} ${idx === currentGroupIdx ? styles.active : ''}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCancelSuccess) {
                        onCancelSuccess(idx, actualAnswerIndex);
                      }
                    }}
                    className={styles.historyCardCloseButton}
                  >
                    ✕
                  </button>
                  <div className={styles.historyCardTitle}>
                    <strong></strong> {successAnswer.text.substring(0, 80)}
                  </div>
                  <div className={styles.historyCardSubtitle}>
                    <strong></strong> {group.prompt.substring(0, 40)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSaveExcuse) {
                        onSaveExcuse(successAnswer.text, successAnswer.excuseId);
                      }
                    }}
                    className={styles.historySaveButton}
                  >
                    <img
                      src="/ノートアイコン.png"
                      alt="保存"
                      className={styles.historySaveButtonIcon}
                    />
                  </button>
                </div>
                );
              })
            : null;
        })}
      </div>
    </div>
  );
}



