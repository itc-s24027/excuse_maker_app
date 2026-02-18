// TypeScript (tsx)
"use client";

import React, { useEffect, useState } from "react";
import LogoutButton from "@/app/_components/GoogleButton/logout";
import { apifetch } from "../lib/apiClient";

/*
  シンプルなチャット画面サンプル。
  - 左: ChatList + Create ボタン（モーダル）
  - 中央: ChatView (AI回答バブル、成功/失敗ボタン、プロンプト入力)
  - 右: TagList
*/

type ChatSummary = { id: string; title: string };
type Message = { id: string; role: "user" | "ai"; text: string };
type Answer = { text: string; deleted: boolean; success: boolean };
type AnswerGroup = { promptId: string; prompt: string; answers: Answer[]; currentIndex: number };

export default function ChatPage() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  // チャットID をキーにしてメッセージを管理
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  // チャットID をキーにしてプロンプトを管理
  const [chatPrompts, setChatPrompts] = useState<Record<string, string>>({});
  // チャットID をキーにして回答グループの履歴を管理（複数のプロンプトに対する回答グループ）
  const [chatAnswerHistory, setChatAnswerHistory] = useState<Record<string, AnswerGroup[]>>({});
  // 現在表示中の回答グループのインデックス
  const [currentGroupIndex, setCurrentGroupIndex] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(true); // 画面読み込み時に自動表示
  const [tags] = useState<string[]>(["遅刻", "学校", "仕事"]);
  const [loading, setLoading] = useState(false);

  // 現在選択されているチャットのメッセージを取得
  const messages = selectedChat ? (chatMessages[selectedChat] ?? []) : [];
  // 現在選択されているチャットのプロンプトを取得（selectedChatがnullの場合は一時的なプロンプトを取得）
  const prompt = selectedChat ? (chatPrompts[selectedChat] ?? "") : (chatPrompts["temp-chat"] ?? "");
  // 現在選択されているチャットの回答グループ履歴を取得
  const answerHistory = selectedChat ? (chatAnswerHistory[selectedChat] ?? []) : [];
  // 現在表示されている回答グループ
  const currentGroupIdx = selectedChat ? (currentGroupIndex[selectedChat] ?? -1) : -1;
  const currentAnswerGroup = currentGroupIdx >= 0 ? answerHistory[currentGroupIdx] : null;
  // 削除されていない回答のみを取得
  const validAnswers = currentAnswerGroup ? currentAnswerGroup.answers.filter(a => !a.deleted) : [];
  // 現在表示されている回答を取得
  const currentAnswerInGroup = currentAnswerGroup ? currentAnswerGroup.answers.findIndex(a => !a.deleted) : -1;
  const currentAnswer = currentAnswerInGroup >= 0 ? validAnswers[0] : null;

  useEffect(() => {
    // 新しいチャットが選択された時、初期メッセージを設定（まだない場合のみ）
    if (selectedChat && !chatMessages[selectedChat]) {
      setChatMessages((prev) => ({
        ...prev,
        [selectedChat]: [
          { id: "m1", role: "ai", text: "ようこそ。要望を入力してください" },
        ],
      }));
    }
  }, [selectedChat, chatMessages]);

  // プロンプト送信処理
  const sendPrompt = async () => {
    if (!prompt.trim()) return; // 空入力は無視

    setLoading(true);

    let chatId = selectedChat;

    // チャットが選択されていない場合は「新規1」で自動作成
    if (!chatId) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_URL) {
          alert("サーバーURLが未設定です");
          setLoading(false);
          return;
        }

        const res = await apifetch(`${API_URL}/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: "新規1" }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("チャット作成エラー", res.status, text);
          alert("チャット作成に失敗しました");
          setLoading(false);
          return;
        }

        const data = await res.json();
        const newChat: ChatSummary = {
          id: data.chat?.id ?? String(Date.now()),
          title: data.chat?.title ?? "新規1",
        };

        // チャットリストに追加して選択
        setChats((prev) => [newChat, ...prev]);
        setSelectedChat(newChat.id);
        chatId = newChat.id;
      } catch (err) {
        console.error("チャット作成エラー:", err);
        alert("チャット作成に失敗しました");
        setLoading(false);
        return;
      }
    }

    // ユーザーメッセージ追加
    const userMsg: Message = { id: String(Date.now()), role: "user", text: prompt };
    if (chatId) {
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] ?? []), userMsg],
      }));
    }
    const promptId = String(Date.now());

    // AI 呼び出し前の準備
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
      if (chatId) {
        setChatMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), { id: String(Date.now() + 2), role: "ai", text: "サーバーURLが未設定です" }],
        }));
      }
      setLoading(false);
      return;
    }

    // AI 呼び出し（言い訳生成＋DB保存）
    try {
      const url = `${API_URL}/gemini-test`;
      const res = await apifetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId,
          situation: userMsg.text,
        }),
      });

      // エラーハンドリング
      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR", res.status, text);
        throw new Error("AI呼び出しに失敗しました");
      }

      const data = await res.json();
      const aiText = data?.excuse ?? "AIの応答に失敗しました";

      // 新しい回答グループを作成
      const newAnswerGroup: AnswerGroup = {
        promptId,
        prompt: userMsg.text,
        answers: [{ text: aiText, deleted: false, success: false }],
        currentIndex: 0,
      };

      // 回答グループ履歴に追加
      if (chatId) {
        setChatAnswerHistory((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), newAnswerGroup],
        }));

        // 新しい回答グループを表示
        setCurrentGroupIndex((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] ?? -1) + 1,
        }));

        setChatMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), { id: String(Date.now() + 1), role: "ai", text: aiText }],
        }));
      }
    } catch (e) {
      console.error("fetchエラー", e);
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

  // 成功を記録
  const markSuccess = () => {
    if (!currentAnswerGroup || currentGroupIdx < 0 || !selectedChat) return;

    setChatAnswerHistory((prev) => {
      const history = [...(prev[selectedChat] ?? [])];
      const groupIndex = currentGroupIdx;
      if (groupIndex >= 0 && groupIndex < history.length) {
        const group = history[groupIndex];
        const newAnswers = [...group.answers];
        // 最初の削除されていない回答に成功フラグを立てる
        const validIndex = newAnswers.findIndex(a => !a.deleted);
        if (validIndex >= 0) {
          newAnswers[validIndex] = { ...newAnswers[validIndex], success: true };
        }
        history[groupIndex] = { ...group, answers: newAnswers };
      }
      return { ...prev, [selectedChat]: history };
    });
  };

  // 回答を削除（論理削除）
  const deleteAnswer = () => {
    if (!currentAnswerGroup || currentGroupIdx < 0 || !selectedChat) return;

    setChatAnswerHistory((prev) => {
      const history = [...(prev[selectedChat] ?? [])];
      const groupIndex = currentGroupIdx;
      if (groupIndex >= 0 && groupIndex < history.length) {
        const group = history[groupIndex];
        const newAnswers = [...group.answers];
        // 最初の削除されていない回答を削除
        const validIndex = newAnswers.findIndex(a => !a.deleted);
        if (validIndex >= 0) {
          newAnswers[validIndex] = { ...newAnswers[validIndex], deleted: true };
        }
        history[groupIndex] = { ...group, answers: newAnswers };
      }
      return { ...prev, [selectedChat]: history };
    });
  };

  // 他の回答をもらう処理
  const getAnotherAnswer = async () => {
    if (!prompt.trim() || !selectedChat || loading || !currentAnswerGroup) return;

    setLoading(true);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
      setLoading(false);
      return;
    }

    try {
      const url = `${API_URL}/gemini-test`;
      const res = await apifetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: selectedChat,
          situation: prompt,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR", res.status, text);
        throw new Error("AI呼び出しに失敗しました");
      }

      const data = await res.json();
      const aiText = data?.excuse ?? "AIの応答に失敗しました";

      // 現在の回答グループに新しい回答を追加
      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat!] ?? [])];
        const groupIndex = currentGroupIdx;
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers, { text: aiText, deleted: false, success: false }];
          history[groupIndex] = { ...group, answers: newAnswers };
        }
        return { ...prev, [selectedChat!]: history };
      });
    } catch (e) {
      console.error("fetchエラー", e);
    } finally {
      setLoading(false);
    }
  };

  // 前の回答を表示（削除されていない回答のみ）
  const showPreviousAnswer = () => {
    if (!currentAnswerGroup || validAnswers.length <= 1) return;

    const currentValidIndex = currentAnswerGroup.answers.findIndex(a => !a.deleted);
    if (currentValidIndex <= 0) return;

    // 前の削除されていない回答を探す
    for (let i = currentValidIndex - 1; i >= 0; i--) {
      if (!currentAnswerGroup.answers[i].deleted) {
        setChatAnswerHistory((prev) => {
          const history = [...(prev[selectedChat!] ?? [])];
          const groupIndex = currentGroupIdx;
          if (groupIndex >= 0 && groupIndex < history.length) {
            history[groupIndex] = { ...history[groupIndex], currentIndex: i };
          }
          return { ...prev, [selectedChat!]: history };
        });
        return;
      }
    }
  };

  // 次の回答を表示（削除されていない回答のみ）
  const showNextAnswer = () => {
    if (!currentAnswerGroup || validAnswers.length <= 1) return;

    const currentValidIndex = currentAnswerGroup.answers.findIndex(a => !a.deleted);
    if (currentValidIndex >= currentAnswerGroup.answers.length - 1) return;

    // 次の削除されていない回答を探す
    for (let i = currentValidIndex + 1; i < currentAnswerGroup.answers.length; i++) {
      if (!currentAnswerGroup.answers[i].deleted) {
        setChatAnswerHistory((prev) => {
          const history = [...(prev[selectedChat!] ?? [])];
          const groupIndex = currentGroupIdx;
          if (groupIndex >= 0 && groupIndex < history.length) {
            history[groupIndex] = { ...history[groupIndex], currentIndex: i };
          }
          return { ...prev, [selectedChat!]: history };
        });
        return;
      }
    }
  };

  const createChat = async (title: string) => {
    // POST /api/chats の呼び出し例
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const fullUrl = `${API_URL}/chats`;

      const res = await apifetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      const text = await res.text();
      console.log("Response status:", res.status);
      console.log("Response body:", text);

      if (!res.ok) {
        throw new Error(`API Error ${res.status}: ${text}`);
      }

      const data = JSON.parse(text);
      // 作成したチャットを一覧に追加して選択
      const newChat: ChatSummary = { id: data.chat?.id ?? String(Date.now()), title: data.chat?.title ?? title };
      setChats((s) => [newChat, ...s]);
      setSelectedChat(newChat.id);
      setShowCreate(false);
    } catch (err) {
      console.error("チャット作成エラー:", err);
      alert("チャット作成に失敗しました: " + String(err));
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", gap: 12, padding: 12 }}>
      {/* 左サイドバー */}
      <aside style={{
        width: 280,
        background: "#fff6e9",
        padding: 16,
        borderRadius: 12,
        border: "2px solid #c3af96",
        display: "flex",
        flexDirection: "column",
      }}>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "12px 16px",
            fontSize: "0.95rem",
            fontWeight: "600",
            color: "#fff",
            background: "#665440",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#9a6044";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#665440";
          }}
        >
          チャット新規作成
        </button>
        <div style={{ marginTop: 16, flex: 1, overflowY: "auto" }}>
          {chats.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedChat(c.id)}
              style={{
                padding: 10,
                marginTop: 8,
                background: c.id === selectedChat ? "#c3af96" : "#fff",
                borderRadius: 8,
                cursor: "pointer",
                border: "1px solid #dfc9ab",
                color: c.id === selectedChat ? "#fff" : "#665440",
                fontWeight: c.id === selectedChat ? "600" : "500",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (c.id !== selectedChat) {
                  e.currentTarget.style.background = "#f0ebe3";
                }
              }}
              onMouseLeave={(e) => {
                if (c.id !== selectedChat) {
                  e.currentTarget.style.background = "#fff";
                }
              }}
            >
              {c.title}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          {/* ここを単純な localStorage 削除＋reload から Firebase signOut を行うコンポーネントに置換 */}
          <LogoutButton />
        </div>
      </aside>

      {/* 中央チャットビュー */}
      <main style={{
        flex: 1,
        background: "#f5f1eb",
        padding: 20,
        borderRadius: 12,
        border: "2px solid #c3af96",
        overflowY: "auto",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#665440",
              marginBottom: "12px",
            }}>
              AIの回答
            </h2>
            {currentAnswer ? (
              <div key="current-answer" style={{
                padding: 20,
                background: "#fff",
                borderRadius: 12,
                fontSize: 18,
                color: "#665440",
                border: "1px solid #dfc9ab",
                lineHeight: 1.6,
              }}>
                {currentAnswer.text}
              </div>
            ) : messages.filter(m => m.role === "ai").slice(-1).map(m => (
              <div key={m.id} style={{
                padding: 20,
                background: "#fff",
                borderRadius: 12,
                fontSize: 18,
                color: "#665440",
                border: "1px solid #dfc9ab",
                lineHeight: 1.6,
              }}>
                {m.text}
              </div>
            ))}
          </div>

          {/* 回答ナビゲーション */}
          {currentAnswerGroup && validAnswers.length > 0 && (
            <div style={{
              display: "flex",
              gap: 12,
              margin: "16px 0",
              alignItems: "center",
              padding: "12px",
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #dfc9ab",
            }}>
              <button
                onClick={showPreviousAnswer}
                disabled={validAnswers.length <= 1}
                style={{
                  padding: "8px 14px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#fff",
                  background: "#665440",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                前の回答
              </button>
              <span style={{ fontSize: 14, color: "#9a6044", fontWeight: "600" }}>
                {validAnswers.length}件の回答
              </span>
              <button
                onClick={showNextAnswer}
                disabled={validAnswers.length <= 1}
                style={{
                  padding: "8px 14px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#fff",
                  background: "#665440",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                次の回答
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, margin: "16px 0", flexWrap: "wrap" }}>
            <button
              onClick={markSuccess}
              style={{
                padding: "10px 20px",
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "#fff",
                background: "#4CAF50",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#45a049";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#4CAF50";
              }}
            >
              成功
            </button>
            <button
              onClick={deleteAnswer}
              style={{
                padding: "10px 20px",
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "#fff",
                background: "#d9534f",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#c9423f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d9534f";
              }}
            >
              削除
            </button>
            <button
              onClick={getAnotherAnswer}
              disabled={loading || !currentAnswerGroup}
              style={{
                padding: "10px 20px",
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "#fff",
                background: "#665440",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading && currentAnswerGroup) {
                  e.currentTarget.style.background = "#9a6044";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && currentAnswerGroup) {
                  e.currentTarget.style.background = "#665440";
                }
              }}
            >
              {loading ? "生成中..." : "他の回答をもらう"}
            </button>
          </div>

          <div style={{ marginTop: 28 }}>
            <label style={{
              display: "block",
              marginBottom: 12,
              fontSize: "1rem",
              fontWeight: "600",
              color: "#665440",
            }}>
              プロンプト
            </label>
            <textarea
              value={prompt}
              onChange={(e) => {
                // チャットが選択されていない場合は、一時的なプロンプトを保持
                if (selectedChat) {
                  setChatPrompts((prev) => ({
                    ...prev,
                    [selectedChat]: e.target.value,
                  }));
                } else {
                  // 初回時はダミーチャットIDで保存
                  const tempChatId = "temp-chat";
                  setChatPrompts((prev) => ({
                    ...prev,
                    [tempChatId]: e.target.value,
                  }));
                }
              }}
              style={{
                width: "100%",
                height: 140,
                borderRadius: 10,
                padding: 14,
                fontSize: "0.95rem",
                border: "2px solid #c3af96",
                fontFamily: "var(--font-noto-sans-jp)",
                color: "#665440",
                background: "#fff",
                resize: "none",
                transition: "all 0.25s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#9a6044";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(154, 96, 68, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#c3af96";
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="要望や状況を入力して AI に相談"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                onClick={sendPrompt}
                disabled={loading}
                style={{
                  padding: "12px 32px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#fff",
                  background: "#665440",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#9a6044";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#665440";
                  }
                }}
              >
                {loading ? "送信中..." : "送信"}
              </button>
            </div>
          </div>

          {/* 成功のみの履歴を横並びで表示 */}
          {answerHistory.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{
                fontSize: "1.2rem",
                fontWeight: "700",
                color: "#665440",
                marginBottom: "12px",
              }}>
                成功の履歴
              </h3>
              <div style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 12,
              }}>
                {answerHistory.map((group, idx) => {
                  const successAnswer = group.answers.find(a => a.success && !a.deleted);
                  return successAnswer ? (
                    <div
                      key={idx}
                      onClick={() => setCurrentGroupIndex((prev) => ({ ...prev, [selectedChat!]: idx }))}
                      style={{
                        minWidth: 250,
                        padding: 14,
                        background: idx === currentGroupIdx ? "#c3af96" : "#fff",
                        borderRadius: 10,
                        cursor: "pointer",
                        border: idx === currentGroupIdx ? "2px solid #665440" : "1px solid #dfc9ab",
                        transition: "all 0.25s ease",
                        color: idx === currentGroupIdx ? "#fff" : "#665440",
                      }}
                      onMouseEnter={(e) => {
                        if (idx !== currentGroupIdx) {
                          e.currentTarget.style.background = "#f0ebe3";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (idx !== currentGroupIdx) {
                          e.currentTarget.style.background = "#fff";
                        }
                      }}
                    >
                      <div style={{
                        fontSize: 12,
                        color: idx === currentGroupIdx ? "rgba(255,255,255,0.9)" : "#9a6044",
                        marginBottom: 6,
                        fontWeight: "600",
                      }}>
                        <strong>Q:</strong> {group.prompt.substring(0, 30)}...
                      </div>
                      <div style={{
                        fontSize: 13,
                        lineHeight: 1.4,
                        color: idx === currentGroupIdx ? "rgba(255,255,255,0.95)" : "#665440",
                      }}>
                        <strong>A:</strong> {successAnswer.text.substring(0, 60)}...
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 右サイドバー (タグ等) */}
      <aside style={{
        width: 280,
        background: "#fff6e9",
        padding: 16,
        borderRadius: 12,
        border: "2px solid #c3af96",
        display: "flex",
        flexDirection: "column",
      }}>
        <h4 style={{
          fontSize: "1rem",
          fontWeight: "700",
          color: "#665440",
          marginBottom: "12px",
        }}>
          タグごとのベスト・オブ・言い訳
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tags.map((t) => (
            <div
              key={t}
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
            >
              {t}
            </div>
          ))}
        </div>
      </aside>

      {/* Create モーダル */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={createChat}
          isFirstChat={chats.length === 0}
        />
      )}
    </div>
  );
}

/* Create モーダル（簡易） */
function CreateModal({ onClose, onCreate, isFirstChat }: { onClose: () => void; onCreate: (title: string) => void; isFirstChat: boolean }) {
  const [title, setTitle] = useState("");

  const submit = () => {
    if (!title.trim()) {
      alert("タイトルを入力してください");
      return;
    }
    onCreate(title);
  };

  const handleCancel = () => {
    // スキップ時：単にモーダルを閉じるだけ
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.4)",
      zIndex: 1000,
      padding: "2rem",
    }}>
      <div style={{
        background: "#fff6e9",
        padding: "3rem",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "600px",
        border: "2px solid #c3af96",
        boxShadow: "0 8px 24px rgba(102, 84, 64, 0.2)",
      }}>
        <h2 style={{
          fontSize: "1.8rem",
          fontWeight: "700",
          color: "#665440",
          marginBottom: "0.5rem",
          textAlign: "center",
        }}>
          新しいチャットを作成しましょう！
        </h2>
        <p style={{
          fontSize: "1rem",
          color: "#9a6044",
          textAlign: "center",
          marginBottom: "2rem",
        }}>
          {isFirstChat ? "タイトルを入力してください" : "タイトルを入力してください。"}
        </p>
        <div style={{ marginBottom: "2rem" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "1rem",
              border: "2px solid #c3af96",
              borderRadius: "10px",
              fontFamily: "var(--font-noto-sans-jp)",
              color: "#665440",
              background: "#fff",
              transition: "all 0.25s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#9a6044";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(154, 96, 68, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#c3af96";
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder="例: 課題が終わらない"
            autoFocus
          />
        </div>
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: "12px 28px",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#665440",
              background: "#fff",
              border: "2px solid #c3af96",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f0ebe3";
              e.currentTarget.style.borderColor = "#9a6044";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#c3af96";
            }}
          >
            {isFirstChat ? "スキップ" : "キャンセル"}
          </button>
          <button
            onClick={submit}
            style={{
              padding: "12px 32px",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#fff",
              background: "#665440",
              border: "2px solid #665440",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#9a6044";
              e.currentTarget.style.borderColor = "#9a6044";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#665440";
              e.currentTarget.style.borderColor = "#665440";
            }}
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
}