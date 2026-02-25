"use client";

import React from "react";
import {
  NavButton,
  ActionButtonSuccess,
  ActionButtonHide,
  ActionButton,
} from "@/app/_components/buttons";
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

interface AnswerDisplayProps {
  currentAnswerGroup: AnswerGroup | null;
  currentAnswer: Answer | null;
  validAnswers: Answer[];
  loading: boolean;
  showHiddenAnswers: boolean;
  onPreviousAnswer: () => void;
  onNextAnswer: () => void;
  onMarkSuccess: () => void;
  onHideAnswer: () => void;
  onUndoHideAnswer: () => void;
  onGetAnotherAnswer: () => void;
  lastAiMessage: string;
}

export default function AnswerDisplay({
  currentAnswerGroup,
  currentAnswer,
  validAnswers,
  loading,
  showHiddenAnswers,
  onPreviousAnswer,
  onNextAnswer,
  onMarkSuccess,
  onHideAnswer,
  onUndoHideAnswer,
  onGetAnotherAnswer,
  lastAiMessage,
}: AnswerDisplayProps) {
  return (
    <div className={styles.answerSection}>
      <div className={styles.answerHeader}>
        <img
          src="/猫アイコン1.png"
          alt="猫アイコン"
          style={{ width: 40, height: 40, paddingTop: 3 }}
        />
        <h2 className={styles.answerTitle}>生成された言い訳</h2>
      </div>

      <div className={styles.answerDisplayRow}>
        {/* 前の回答ボタン */}
        <NavButton
          onClick={onPreviousAnswer}
          disabled={!currentAnswerGroup || currentAnswerGroup.answers.length <= 1}
        >
          ◀
        </NavButton>

        {/* AIの回答 */}
        <div
          key="current-answer"
          className={`${styles.answerBox} ${currentAnswer?.success ? styles.success : ''} ${
            currentAnswer?.deleted && showHiddenAnswers ? styles.deleted : ''
          }`}
        >
          {currentAnswer?.deleted && showHiddenAnswers && (
            <div className={styles.deletedLabel}>非表示</div>
          )}
          <div
            className={`${styles.answerBoxContent} ${
              currentAnswer?.deleted && showHiddenAnswers ? styles.deleted : ''
            }`}
          >
            {currentAnswer?.text || lastAiMessage || "AIの回答を待っています..."}
          </div>
        </div>

        {/* 次の回答ボタン */}
        <NavButton
          onClick={onNextAnswer}
          disabled={!currentAnswerGroup || currentAnswerGroup.answers.length <= 1}
        >
          ▶
        </NavButton>
      </div>

      {/* 回答のページ数表示 */}
      {currentAnswerGroup && validAnswers.length > 0 && (
        <div className={styles.answerPagination}>
          <span className={styles.answerPageNumber}>
            {currentAnswer
              ? (() => {
                  const currentAnswerIndex = currentAnswerGroup.answers.findIndex(
                    (a) => a === currentAnswer
                  );
                  if (currentAnswerIndex >= 0) {
                    const position = currentAnswerGroup.answers
                      .slice(0, currentAnswerIndex + 1)
                      .filter((a) => !a.deleted).length;
                    return `${position} / ${validAnswers.length}`;
                  }
                  return `${validAnswers.length} / ${validAnswers.length}`;
                })()
              : `${validAnswers.length} / ${validAnswers.length}`}
          </span>
        </div>
      )}

      {/* 回答ボタン */}
      <div className={styles.answerButtonRow}>
        <ActionButtonSuccess
          onClick={onMarkSuccess}
          disabled={currentAnswer?.success}
        >
          成功
        </ActionButtonSuccess>
        <ActionButtonHide
          onClick={onHideAnswer}
          disabled={!currentAnswer || currentAnswer.deleted || currentAnswer.success}
        >
          非表示
        </ActionButtonHide>
        {currentAnswer?.deleted && (
          <ActionButton onClick={onUndoHideAnswer}>
            非表示を解除
          </ActionButton>
        )}
        <ActionButton
          onClick={onGetAnotherAnswer}
          disabled={loading || !currentAnswerGroup}
        >
          {loading ? "生成中..." : "他の回答をもらう"}
        </ActionButton>
      </div>
    </div>
  );
}

