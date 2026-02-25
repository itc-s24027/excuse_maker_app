"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/app/_components/GoogleButton/logout";
import SaveExcuseModal from "@/app/_components/chat/SaveExcuseModal";
import {
  PrimaryButton,
  SendButton,
  NavButton,
  ActionButton,
  ActionButtonSuccess,
  ActionButtonHide,
  MenuOption,
  PopupButton,
  DialogButton,
  ModalButton,
  CreateModalButton,
  MenuButton,
} from "@/app/_components/buttons";
import {
  fetchChats,
  fetchChatDetail,
  createChat,
  deleteChat,
  updateChatTitle,
  generateExcuse,
  markExcuseAsSuccess,
  toggleExcuseVisibility,
  saveExcuse,
  ChatSummary,
  AnswerGroup,
  Message,
  Answer,
} from "@/app/api/chat";
import { fetchTags, Tag } from "@/app/api/tag";
import styles from "./page.module.css";
export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [chatPrompts, setChatPrompts] = useState<Record<string, string>>({});
  const [chatAnswerHistory, setChatAnswerHistory] = useState<Record<string, AnswerGroup[]>>({});
  const [currentGroupIndex, setCurrentGroupIndex] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccessHistory, setShowSuccessHistory] = useState(false);
  const [showHiddenAnswers, setShowHiddenAnswers] = useState<Record<string, boolean>>({});
  const [deleteConfirmChatId, setDeleteConfirmChatId] = useState<string | null>(null);
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [editTitleChatId, setEditTitleChatId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [chatWithTaggedExcuses, setChatWithTaggedExcuses] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lastExcuseText, setLastExcuseText] = useState("");
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const showAlert = (message: string) => {
    setPopupMessage(message);
    setShowPopup(true);
  };
  // 導出値
  const messages = selectedChat ? (chatMessages[selectedChat] ?? []) : [];
  const prompt = selectedChat ? (chatPrompts[selectedChat] ?? "") : (chatPrompts["temp-chat"] ?? "");
  const answerHistory = selectedChat ? (chatAnswerHistory[selectedChat] ?? []) : [];
  const currentGroupIdx = selectedChat ? (currentGroupIndex[selectedChat] ?? -1) : -1;
  const currentAnswerGroup = currentGroupIdx >= 0 ? answerHistory[currentGroupIdx] : null;
  const validAnswers = currentAnswerGroup ? currentAnswerGroup.answers.filter((a: Answer) => !a.deleted) : [];
  const currentAnswerIndex = currentAnswerGroup ? currentAnswerGroup.currentIndex : -1;
  const currentAnswer = currentAnswerGroup && currentAnswerIndex >= 0 && currentAnswerIndex < currentAnswerGroup.answers.length
    ? (currentAnswerGroup.answers[currentAnswerIndex].deleted ? null : currentAnswerGroup.answers[currentAnswerIndex])
    : (validAnswers.length > 0 ? validAnswers[validAnswers.length - 1] : null);
  // チャット詳細取得
  useEffect(() => {
    if (!selectedChat || chatMessages[selectedChat]) {
      return;
    }
    let isMounted = true;
    const abortController = new AbortController();
    const loadChatDetail = async () => {
      try {
        const answerGroups = await fetchChatDetail(selectedChat, abortController.signal);
        if (!isMounted) return;
        const initialMessages: Message[] = [
          { id: "m1", role: "ai", text: "ようこそ。要望を入力してください" },
        ];
        setChatMessages((prev) => ({
          ...prev,
          [selectedChat]: initialMessages,
        }));
        if (answerGroups.length > 0) {
          setChatAnswerHistory((prev) => ({
            ...prev,
            [selectedChat]: answerGroups,
          }));
          const lastPrompt = answerGroups[answerGroups.length - 1].prompt;
          setChatPrompts((prev) => ({
            ...prev,
            [selectedChat]: lastPrompt,
          }));
          setCurrentGroupIndex((prev) => ({
            ...prev,
            [selectedChat]: Math.max(0, answerGroups.length - 1),
          }));
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log("チャット詳細取得がキャンセルされました");
          return;
        }
        console.error("チャット詳細取得エラー:", error);
      }
    };
    loadChatDetail();
    return () => {
      isMounted = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);
  // チャットリスト取得
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    const loadChats = async () => {
      try {
        const chatsFromDB = await fetchChats();
        if (!isMounted) return;
        setChats(chatsFromDB);
        if (chatsFromDB.length > 0) {
          setSelectedChat(chatsFromDB[0].id);
          setShowCreate(false);
        } else {
          setShowCreate(true);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log("チャットリスト取得がキャンセルされました");
          return;
        }
        console.error("チャットリスト取得エラー:", error);
      }
    };
    loadChats();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);
  // タグ取得
  const handleFetchTags = async () => {
    try {
      const fetchedTags = await fetchTags();
      setTags(fetchedTags);
    } catch (err) {
      console.error("タグ取得エラー:", err);
    }
  };
  useEffect(() => {
    handleFetchTags();
  }, []);
  // 言い訳保存
  const handleSaveExcuse = async (selectedTags: Tag[]) => {
    try {
      if (!selectedChat || !currentAnswer) {
        showAlert("チャットまたは言い訳が選択されていません");
        return;
      }
      const tagIds = selectedTags
        .map((tag) => tag.id)
        .filter((id): id is string => id !== undefined && id !== null);
      console.log("保存するタグID:", tagIds);
      await saveExcuse(selectedChat, currentAnswer.text, prompt, tagIds);
      setShowSaveModal(false);
      showAlert("言い訳を保存しました！");
      await handleFetchTags();
    } catch (err) {
      console.error("言い訳保存エラー:", err);
      showAlert(err instanceof Error ? err.message : "言い訳の保存に失敗しました");
    }
  };
  // プロンプト送信
  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    let chatId = selectedChat;
    if (!chatId) {
      try {
        const newChat = await createChat("新規1");
        setChats((prev) => [newChat, ...prev]);
        setSelectedChat(newChat.id);
        const tempPrompt = chatPrompts["temp-chat"] ?? prompt;
        setChatPrompts((prev) => {
          const updated = { ...prev };
          delete updated["temp-chat"];
          updated[newChat.id] = tempPrompt;
          return updated;
        });
        chatId = newChat.id;
      } catch (err) {
        console.error("チャット作成エラー:", err);
        showAlert("チャット作成に失敗しました");
        setLoading(false);
        return;
      }
    }
    const userMsg: Message = { id: String(Date.now()), role: "user", text: prompt };
    if (chatId) {
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] ?? []), userMsg],
      }));
    }
    const promptId = String(Date.now());
    try {
      const { excuse, excuseId } = await generateExcuse(chatId, userMsg.text);
      const newAnswerGroup: AnswerGroup = {
        promptId,
        prompt: userMsg.text,
        answers: [{ text: excuse, deleted: false, success: false, excuseId: excuseId || "" }],
        currentIndex: 0,
      };
      if (chatId) {
        setChatAnswerHistory((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), newAnswerGroup],
        }));
        setCurrentGroupIndex((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] ?? -1) + 1,
        }));
        setChatMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), { id: String(Date.now() + 1), role: "ai", text: excuse }],
        }));
      }
    } catch (e) {
      console.error("AI呼び出しエラー", e);
      const errorMsg = "AI呼び出しに失敗しました";
      if (chatId) {
        setChatMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), { id: String(Date.now() + 2), role: "ai", text: errorMsg }],
        }));
      }
    } finally {
      setLoading(false);
    }
  };
  // 成功マーク
  const markSuccess = async () => {
    if (!currentAnswerGroup || currentGroupIdx < 0 || !selectedChat || !currentAnswer) return;
    try {
      const currentIdx = currentAnswerIndex;
      const excuseId = currentAnswerGroup.answers[currentIdx]?.excuseId;
      if (!excuseId) {
        console.error("ExcuseIDが見つかりません");
        return;
      }
      await markExcuseAsSuccess(selectedChat, excuseId, true);
      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat] ?? [])];
        const groupIndex = currentGroupIdx;
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers];
          if (currentIdx >= 0 && currentIdx < newAnswers.length && !newAnswers[currentIdx].deleted) {
            newAnswers[currentIdx] = { ...newAnswers[currentIdx], success: true };
          }
          history[groupIndex] = { ...group, answers: newAnswers };
        }
        return { ...prev, [selectedChat]: history };
      });
      console.log("成功フラグを保存しました");
    } catch (error) {
      console.error("成功フラグ保存エラー:", error);
    }
  };
  // 非表示
  const hideAnswer = async () => {
    if (!currentAnswerGroup || currentGroupIdx < 0 || !selectedChat || !currentAnswer) return;
    try {
      const currentIdx = currentAnswerIndex;
      const excuseId = currentAnswerGroup.answers[currentIdx]?.excuseId;
      if (!excuseId) {
        console.error("ExcuseIDが見つかりません");
        return;
      }
      await toggleExcuseVisibility(selectedChat, excuseId, true);
      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat] ?? [])];
        const groupIndex = currentGroupIdx;
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers];
          if (currentIdx >= 0 && currentIdx < newAnswers.length) {
            newAnswers[currentIdx] = { ...newAnswers[currentIdx], deleted: true };
          }
          let nextValidIdx = -1;
          for (let i = currentIdx + 1; i < newAnswers.length; i++) {
            if (!newAnswers[i].deleted) {
              nextValidIdx = i;
              break;
            }
          }
          if (nextValidIdx === -1) {
            for (let i = currentIdx - 1; i >= 0; i--) {
              if (!newAnswers[i].deleted) {
                nextValidIdx = i;
                break;
              }
            }
          }
          const newCurrentIndex = nextValidIdx >= 0 ? nextValidIdx : currentIdx;
          history[groupIndex] = { ...group, answers: newAnswers, currentIndex: newCurrentIndex };
        }
        return { ...prev, [selectedChat]: history };
      });
    } catch (error) {
      console.error("非表示フラグ保存エラー:", error);
    }
  };
  // 非表示解除
  const undoHideAnswer = async () => {
    if (!currentAnswerGroup || currentGroupIdx < 0 || !selectedChat || !currentAnswer) return;
    try {
      const currentIdx = currentAnswerIndex;
      const excuseId = currentAnswerGroup.answers[currentIdx]?.excuseId;
      if (!excuseId) {
        console.error("ExcuseIDが見つかりません");
        return;
      }
      await toggleExcuseVisibility(selectedChat, excuseId, false);
      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat] ?? [])];
        const groupIndex = currentGroupIdx;
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers];
          if (currentIdx >= 0 && currentIdx < newAnswers.length) {
            newAnswers[currentIdx] = { ...newAnswers[currentIdx], deleted: false };
          }
          history[groupIndex] = { ...group, answers: newAnswers };
        }
        return { ...prev, [selectedChat]: history };
      });
    } catch (error) {
      console.error("非表示解除エラー:", error);
    }
  };
  // 成功をキャンセル
  const cancelSuccess = async (groupIndex: number, answerIndex: number) => {
    if (!selectedChat) return;
    try {
      const history = chatAnswerHistory[selectedChat] ?? [];
      if (groupIndex >= 0 && groupIndex < history.length) {
        const group = history[groupIndex];
        if (answerIndex >= 0 && answerIndex < group.answers.length) {
          const excuseId = group.answers[answerIndex].excuseId;
          if (!excuseId) {
            console.error("ExcuseIDが見つかりません");
            return;
          }
          await markExcuseAsSuccess(selectedChat, excuseId, false);
        }
      }
      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat] ?? [])];
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers];
          if (answerIndex >= 0 && answerIndex < newAnswers.length) {
            newAnswers[answerIndex] = { ...newAnswers[answerIndex], success: false };
          }
          history[groupIndex] = { ...group, answers: newAnswers };
        }
        return { ...prev, [selectedChat]: history };
      });
    } catch (error) {
      console.error("成功フラグ取り消しエラー:", error);
    }
  };
  // 非表示をキャンセル
  const cancelHide = (groupIndex: number, answerIndex: number) => {
    if (!selectedChat) return;
    setChatAnswerHistory((prev) => {
      const history = [...(prev[selectedChat] ?? [])];
      if (groupIndex >= 0 && groupIndex < history.length) {
        const group = history[groupIndex];
        const newAnswers = [...group.answers];
        if (answerIndex >= 0 && answerIndex < newAnswers.length) {
          newAnswers[answerIndex] = { ...newAnswers[answerIndex], deleted: false };
        }
        history[groupIndex] = { ...group, answers: newAnswers };
      }
      return { ...prev, [selectedChat]: history };
    });
  };
  // 非表示を見る切り替え
  const toggleShowHiddenAnswers = () => {
    if (!selectedChat) return;
    setShowHiddenAnswers((prev) => ({
      ...prev,
      [selectedChat]: !prev[selectedChat],
    }));
  };
  // 他の回答をもらう
  const getAnotherAnswer = async () => {
    if (!prompt.trim() || loading || !currentAnswerGroup || !selectedChat) return;
    setLoading(true);
    try {
      const { excuse, excuseId } = await generateExcuse(selectedChat, prompt);
      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat!] ?? [])];
        const groupIndex = currentGroupIdx;
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers, { text: excuse, deleted: false, success: false, excuseId: excuseId || "" }];
          history[groupIndex] = {
            ...group,
            answers: newAnswers,
            currentIndex: newAnswers.length - 1
          };
        }
        return { ...prev, [selectedChat!]: history };
      });
    } catch (e) {
      console.error("fetchエラー", e);
    } finally {
      setLoading(false);
    }
  };
  // 前の回答
  const showPreviousAnswer = () => {
    if (!currentAnswerGroup || validAnswers.length <= 1) return;
    const currentIdx = currentAnswerGroup.currentIndex;
    let found = false;
    for (let i = currentIdx - 1; i >= 0; i--) {
      if (!currentAnswerGroup.answers[i].deleted) {
        setChatAnswerHistory((prev) => {
          const history = [...(prev[selectedChat!] ?? [])];
          const groupIndex = currentGroupIdx;
          if (groupIndex >= 0 && groupIndex < history.length) {
            history[groupIndex] = { ...history[groupIndex], currentIndex: i };
          }
          return { ...prev, [selectedChat!]: history };
        });
        found = true;
        return;
      }
    }
  };
  // 次の回答
  const showNextAnswer = () => {
    if (!currentAnswerGroup || validAnswers.length <= 1) return;
    const currentIdx = currentAnswerGroup.currentIndex;
    let found = false;
    for (let i = currentIdx + 1; i < currentAnswerGroup.answers.length; i++) {
      if (!currentAnswerGroup.answers[i].deleted) {
        setChatAnswerHistory((prev) => {
          const history = [...(prev[selectedChat!] ?? [])];
          const groupIndex = currentGroupIdx;
          if (groupIndex >= 0 && groupIndex < history.length) {
            history[groupIndex] = { ...history[groupIndex], currentIndex: i };
          }
          return { ...prev, [selectedChat!]: history };
        });
        found = true;
        return;
      }
    }
  };
  // チャット作成
  const handleCreateChat = async (title: string) => {
    try {
      const newChat = await createChat(title);
      setChats((s) => [newChat, ...s]);
      setSelectedChat(newChat.id);
      setShowCreate(false);
    } catch (err) {
      console.error("チャット作成エラー:", err);
      showAlert("チャット作成に失敗しました: " + String(err));
    }
  };
  // チャット削除
  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId);
      const updatedChats = chats.filter((chat) => chat.id !== chatId);
      setChats(updatedChats);
      setChatMessages((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
      setChatPrompts((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
      setChatAnswerHistory((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
      setCurrentGroupIndex((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
      if (selectedChat === chatId) {
        setSelectedChat(null);
        if (updatedChats.length > 0) {
          setSelectedChat(updatedChats[0].id);
          setShowCreate(false);
        } else {
          setShowCreate(true);
        }
      }
      setDeleteConfirmChatId(null);
      setChatWithTaggedExcuses(false);
      setOpenMenuChatId(null);
      if (chatWithTaggedExcuses) {
        showAlert("チャットとランキングに登録された言い訳を削除しました");
      } else {
        showAlert("チャットを削除しました");
      }
    } catch (error) {
      console.error("チャット削除エラー:", error);
      showAlert("チャット削除に失敗しました");
    }
  };
  // タイトル更新
  const handleUpdateChatTitle = async () => {
    if (!editTitleChatId || !editTitleValue.trim()) {
      showAlert("タイトルを入力してください");
      return;
    }
    try {
      await updateChatTitle(editTitleChatId, editTitleValue.trim());
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === editTitleChatId ? { ...chat, title: editTitleValue.trim() } : chat
        )
      );
      setEditTitleChatId(null);
      setEditTitleValue("");
      setOpenMenuChatId(null);
      showAlert("タイトルを更新しました");
    } catch (error) {
      console.error("タイトル更新エラー:", error);
      showAlert("タイトル更新に失敗しました");
    }
  };
  // タグクリック
  const handleTagClick = (tagId?: string) => {
    if (tagId) {
      router.push(`/tag-ranking/${tagId}`);
    }
  };
  return (
    <div className={styles.mainContainer}>
      {/* ハンバーガーメニュー */}
      <button
        className={styles.hamburgerButton}
        onClick={() => setShowSidebar(!showSidebar)}
      >
        ☰
      </button>
      <button
        className={styles.hamburgerRightButton}
        onClick={() => setShowRightSidebar(!showRightSidebar)}
      >
        ⋮
      </button>
      {/* 左サイドバー */}
      <aside className={`${styles.sidebar} ${showSidebar ? styles.open : ''}`}>
        <PrimaryButton onClick={() => setShowCreate(true)}>
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
                onClick={() => setSelectedChat(c.id)}
              >
                {c.title}
              </div>
              <div className={styles.chatMenuButtonContainer}>
                <MenuButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuChatId(openMenuChatId === c.id ? null : c.id);
                  }}
                >
                  ⋯
                </MenuButton>
                {openMenuChatId === c.id && (
                  <div className={styles.chatMenuDropdown}>
                    <MenuOption
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTitleChatId(c.id);
                        setEditTitleValue(c.title);
                      }}
                    >
                      編集
                    </MenuOption>
                    <MenuOption
                      isDelete={true}
                      onClick={(e) => {
                        e.stopPropagation();
                        const chatAnswers = chatAnswerHistory[c.id] ?? [];
                        const hasTaggedExcuses = chatAnswers.some(group =>
                          group.answers.some(answer => {
                            return !answer.deleted && answer.tags && answer.tags.length > 0;
                          })
                        );
                        setChatWithTaggedExcuses(hasTaggedExcuses);
                        setDeleteConfirmChatId(c.id);
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
      {/* 中央チャットビュー */}
      <main className={styles.chatArea}>
        <div className={styles.chatAreaContent}>
          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
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
                onClick={showPreviousAnswer}
                disabled={!currentAnswerGroup || currentAnswerGroup.answers.length <= 1}
              >
                ◀
              </NavButton>
              {/* AIの回答 */}
              <div key="current-answer" className={`${styles.answerBox} ${currentAnswer?.success ? styles.success : ''} ${currentAnswer?.deleted && showHiddenAnswers[selectedChat!] ? styles.deleted : ''}`}>
                {currentAnswer?.deleted && showHiddenAnswers[selectedChat!] && (
                  <div className={styles.deletedLabel}>非表示</div>
                )}
                <div className={`${styles.answerBoxContent} ${currentAnswer?.deleted && showHiddenAnswers[selectedChat!] ? styles.deleted : ''}`}>
                  {currentAnswer?.text || (messages.filter(m => m.role === "ai").slice(-1)[0]?.text || "AIの回答を待っています...")}
                </div>
              </div>
              {/* 次の回答ボタン */}
              <NavButton
                onClick={showNextAnswer}
                disabled={!currentAnswerGroup || currentAnswerGroup.answers.length <= 1}
              >
                ▶
              </NavButton>
            </div>
          </div>
          {/*回答のページ数表示*/}
          {currentAnswerGroup && validAnswers.length > 0 && (
            <div className={styles.answerPagination}>
              <span className={styles.answerPageNumber}>
                {currentAnswer ? (() => {
                  const currentAnswerIndex = currentAnswerGroup.answers.findIndex(a => a === currentAnswer);
                  if (currentAnswerIndex >= 0) {
                    const position = currentAnswerGroup.answers
                      .slice(0, currentAnswerIndex + 1)
                      .filter(a => !a.deleted).length;
                    return `${position}/${validAnswers.length}`;
                  }
                  return `1/${validAnswers.length}`;
                })() : `1/${validAnswers.length}`}
              </span>
            </div>
          )}
          <div className={styles.answerButtonRow}>
            <ActionButtonSuccess
              onClick={markSuccess}
              disabled={currentAnswer?.success}
            >
              成功
            </ActionButtonSuccess>
            <ActionButtonHide
              onClick={hideAnswer}
              disabled={!currentAnswer || currentAnswer.deleted || currentAnswer.success}
            >
              非表示
            </ActionButtonHide>
            {currentAnswer?.deleted && (
              <ActionButton
                onClick={undoHideAnswer}
              >
                非表示を解除
              </ActionButton>
            )}
            <ActionButton
              onClick={getAnotherAnswer}
              disabled={loading || !currentAnswerGroup}
            >
              {loading ? "生成中..." : "他の回答をもらう"}
            </ActionButton>
          </div>
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
              onChange={(e) => {
                if (selectedChat) {
                  setChatPrompts((prev) => ({
                    ...prev,
                    [selectedChat]: e.target.value,
                  }));
                } else {
                  const tempChatId = "temp-chat";
                  setChatPrompts((prev) => ({
                    ...prev,
                    [tempChatId]: e.target.value,
                  }));
                }
              }}
              className={styles.promptTextarea}
              placeholder="要望や状況を入力して AI に相談"
            />
            <div className={styles.promptButtonContainer}>
              <SendButton onClick={sendPrompt} disabled={loading}>
                {loading ? "送信中..." : "送信"}
              </SendButton>
            </div>
            {/* 成功の履歴ボタン */}
            <div className={styles.historyToggleContainer}>
              <button
                onClick={() => setShowSuccessHistory(!showSuccessHistory)}
                disabled={answerHistory.filter(g => g.answers.some(a => a.success && !a.deleted)).length === 0}
                className={`${styles.historyToggleButton} ${answerHistory.filter(g => g.answers.some(a => a.success && !a.deleted)).length > 0 ? styles.success : ''}`}
              >
                成功一覧
              </button>
              {/* 非表示を見るボタン */}
              <button
                onClick={toggleShowHiddenAnswers}
                disabled={!currentAnswerGroup || !currentAnswerGroup.answers.some(a => a.deleted)}
                className={`${styles.historyToggleButton} ${!currentAnswerGroup || !currentAnswerGroup.answers.some(a => a.deleted) ? '' : styles.hidden}`}
              >
                {showHiddenAnswers[selectedChat!] ? "非表示一覧" : "非表示一覧"}
              </button>
            </div>
            {/* 成功の履歴一覧 */}
            {showSuccessHistory && answerHistory.length > 0 && answerHistory.some(g => g.answers.some(a => a.success && !a.deleted)) && (
              <div className={styles.successHistoryContainer}>
                <div className={styles.historyScrollContainer}>
                  {answerHistory.map((group, idx) => {
                    const successAnswers = group.answers.filter(a => a.success && !a.deleted);
                    return successAnswers.length > 0 ? successAnswers.map((successAnswer, ansIdx) => (
                      <div
                        key={`${idx}-${ansIdx}`}
                        onClick={() => setCurrentGroupIndex((prev) => ({ ...prev, [selectedChat!]: idx }))}
                        className={`${styles.historyCard} ${idx === currentGroupIdx ? styles.active : ''}`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const answerIndexInGroup = group.answers.findIndex((a) => a === successAnswer);
                            cancelSuccess(idx, answerIndexInGroup);
                          }}
                          className={styles.historyCardCloseButton}
                        >
                          ✕
                        </button>
                        <div className={styles.historyCardTitle}>
                          {successAnswer.text.substring(0, 80)}
                        </div>
                        <div className={styles.historyCardSubtitle}>
                          {group.prompt.substring(0, 40)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLastExcuseText(successAnswer.text);
                            setShowSaveModal(true);
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
                    )) : null;
                  })}
                </div>
              </div>
            )}
            {/* 非表示の履歴一覧 */}
            {showHiddenAnswers[selectedChat!] && answerHistory.length > 0 && (
              <div className={styles.hiddenHistoryContainer}>
                <div className={styles.historyScrollContainer}>
                  {answerHistory.map((group, idx) => {
                    const hiddenAnswers = group.answers.filter(a => a.deleted);
                    return hiddenAnswers.length > 0 ? hiddenAnswers.map((hiddenAnswer, ansIdx) => (
                      <div
                        key={`${idx}-${ansIdx}`}
                        onClick={() => setCurrentGroupIndex((prev) => ({ ...prev, [selectedChat!]: idx }))}
                        className={`${styles.hiddenHistoryCard} ${idx === currentGroupIdx ? styles.active : ''}`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const answerIndexInGroup = group.answers.findIndex((a) => a === hiddenAnswer);
                            cancelHide(idx, answerIndexInGroup);
                          }}
                          className={styles.hiddenHistoryCardCloseButton}
                        >
                          ✕
                        </button>
                        <div className={styles.hiddenHistoryCardTitle}>
                          {group.prompt.substring(0, 35)}
                        </div>
                        <div className={styles.hiddenHistoryCardText}>
                          {hiddenAnswer.text.substring(0, 80)}
                        </div>
                      </div>
                    )) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* 右サイドバー */}
      <aside className={`${styles.rightSidebar} ${showRightSidebar ? styles.open : ''}`}>
        {tags.length > 0 ? (
          <div>
            <h4 style={{
              fontSize: "0.9rem",
              fontWeight: "700",
              color: "#665440",
              marginBottom: "8px",
            }}>
              タグ一覧
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tags.map((t) => (
                <div
                  key={t.id || t.title}
                  style={{
                    background: "#fff",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #dfc9ab",
                    color: "#665440",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#c3af96";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.color = "#665440";
                  }}
                  onClick={() => handleTagClick(t.id)}
                >
                  {t.title}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
      {/* Create モーダル */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateChat}
          isFirstChat={chats.length === 0}
          onAlert={showAlert}
        />
      )}
      {/* Save Excuse モーダル */}
      <SaveExcuseModal
        isOpen={showSaveModal}
        excuseText={lastExcuseText}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveExcuse}
        availableTags={tags}
        onTagsUpdated={handleFetchTags}
      />
      {/* チャット削除確認ダイアログ */}
      {deleteConfirmChatId && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <h3 className={styles.dialogTitle}>本当にチャットを削除しますか？</h3>
            {chatWithTaggedExcuses && (
              <p className={styles.dialogWarning}>
                ⚠️ ランキングに登録されている言い訳があります。本当に削除しますか？
              </p>
            )}
            <p className={styles.dialogMessage}>このアクションは取り消せません。</p>
            <div className={styles.dialogButtonsContainer}>
              <DialogButton
                variant="delete"
                onClick={() => {
                  handleDeleteChat(deleteConfirmChatId);
                }}
              >
                はい
              </DialogButton>
              <DialogButton
                variant="cancel"
                onClick={() => {
                  setDeleteConfirmChatId(null);
                  setChatWithTaggedExcuses(false);
                }}
              >
                いいえ
              </DialogButton>
            </div>
          </div>
        </div>
      )}
      {/* チャットのタイトル編集モーダル */}
      {editTitleChatId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>チャットタイトルを編集</h3>
            <input
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdateChatTitle();
                }
              }}
              className={styles.modalInput}
              autoFocus
            />
            <div className={styles.modalButtonsContainer}>
              <ModalButton
                variant="cancel"
                onClick={() => {
                  setEditTitleChatId(null);
                  setEditTitleValue("");
                }}
              >
                キャンセル
              </ModalButton>
              <ModalButton
                variant="submit"
                onClick={handleUpdateChatTitle}
              >
                更新
              </ModalButton>
            </div>
          </div>
        </div>
      )}
      {/* ポップアップ通知 */}
      {showPopup && (
        <div className={styles.popupContainer}>
          <p className={styles.popupMessage}>{popupMessage}</p>
          <div className={styles.popupButtonsContainer}>
            <PopupButton onClick={() => setShowPopup(false)}>
              OK
            </PopupButton>
          </div>
        </div>
      )}
      {/* ポップアップ背景オーバーレイ */}
      {showPopup && <div className={styles.popupOverlay} onClick={() => setShowPopup(false)} />}
    </div>
  );
}
/* Create モーダル */
function CreateModal({ onClose, onCreate, isFirstChat, onAlert }: { onClose: () => void; onCreate: (title: string) => void; isFirstChat: boolean; onAlert: (message: string) => void }) {
  const [title, setTitle] = useState("");

  const submit = () => {
    if (!title.trim()) {
      onAlert("タイトルを入力してください");
      return;
    }
    onCreate(title);
  };

  const handleCancel = () => {
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
