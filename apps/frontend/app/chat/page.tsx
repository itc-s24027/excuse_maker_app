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
type AnswerGroup = { promptId: string; answers: string[]; currentIndex: number };

export default function ChatPage() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  // チャットID をキーにしてメッセージを管理
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  // チャットID をキーにしてプロンプトを管理
  const [chatPrompts, setChatPrompts] = useState<Record<string, string>>({});
  // チャットID をキーにして回答グループを管理
  const [chatAnswerGroups, setChatAnswerGroups] = useState<Record<string, AnswerGroup>>({});
  const [showCreate, setShowCreate] = useState(true); // 画面読み込み時に自動表示
  const [tags] = useState<string[]>(["遅刻", "学校", "仕事"]);
  const [loading, setLoading] = useState(false);

  // 現在選択されているチャットのメッセージを取得
  const messages = selectedChat ? (chatMessages[selectedChat] ?? []) : [];
  // 現在選択されているチャットのプロンプトを取得
  const prompt = selectedChat ? (chatPrompts[selectedChat] ?? "") : "";
  // 現在選択されているチャットの回答グループを取得
  const answerGroup = selectedChat ? (chatAnswerGroups[selectedChat] ?? null) : null;
  // 現在表示されている回答を取得
  const currentAnswer = answerGroup ? answerGroup.answers[answerGroup.currentIndex] : null;

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

  // メッセージ追加ヘルパー
  const addMessage = (m: Message) => {
    if (!selectedChat) return;
    setChatMessages((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] ?? []), m],
    }));
  };

  // プロンプト送信処理
  const sendPrompt = async () => {
    if (!prompt.trim() || !selectedChat) return; // 空入力またはチャット未選択は無視

    setLoading(true);

    // ユーザーメッセージ追加
    const userMsg: Message = { id: String(Date.now()), role: "user", text: prompt };
    addMessage(userMsg);
    const promptId = String(Date.now());

    // AI 呼び出し前の準備
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
      addMessage({ id: String(Date.now() + 2), role: "ai", text: "サーバーURLが未設定です" });
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
          chatId: selectedChat,
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

      // 回答グループを作成・更新
      setChatAnswerGroups((prev) => ({
        ...prev,
        [selectedChat]: {
          promptId,
          answers: [aiText],
          currentIndex: 0,
        },
      }));

      addMessage({ id: String(Date.now() + 1), role: "ai", text: aiText });
    } catch (e) {
      console.error("fetchエラー", e);
      const errorMsg = "AI呼び出しに失敗しました";
      addMessage({ id: String(Date.now() + 2), role: "ai", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const markEvaluation = async (success: boolean | null) => {
    // ここでは最新の AI 回答を評価する（API 呼び出しは省略）
    console.log("評価:", success);
  };

  // 他の回答をもらう処理
  const getAnotherAnswer = async () => {
    if (!prompt.trim() || !selectedChat || loading) return;

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

      // 回答グループに新しい回答を追加
      setChatAnswerGroups((prev) => {
        const current = prev[selectedChat];
        if (!current) return prev;

        const newAnswers = [...current.answers, aiText];
        return {
          ...prev,
          [selectedChat]: {
            ...current,
            answers: newAnswers,
            currentIndex: newAnswers.length - 1, // 最新の回答に移動
          },
        };
      });
    } catch (e) {
      console.error("fetchエラー", e);
    } finally {
      setLoading(false);
    }
  };

  // 前の回答を表示
  const showPreviousAnswer = () => {
    if (!answerGroup || answerGroup.currentIndex <= 0) return;

    setChatAnswerGroups((prev) => ({
      ...prev,
      [selectedChat!]: {
        ...answerGroup,
        currentIndex: answerGroup.currentIndex - 1,
      },
    }));
  };

  // 次の回答を表示
  const showNextAnswer = () => {
    if (!answerGroup || answerGroup.currentIndex >= answerGroup.answers.length - 1) return;

    setChatAnswerGroups((prev) => ({
      ...prev,
      [selectedChat!]: {
        ...answerGroup,
        currentIndex: answerGroup.currentIndex + 1,
      },
    }));
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
      <aside style={{ width: 220, background: "#f3f3f3", padding: 12, borderRadius: 8 }}>
        <button onClick={() => setShowCreate(true)}>チャット新規作成</button>
        <div style={{ marginTop: 12 }}>
          {chats.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedChat(c.id)}
              style={{
                padding: 8,
                marginTop: 8,
                background: c.id === selectedChat ? "#ddd" : "#fff",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {c.title}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 20 }}>
          {/* ここを単純な localStorage 削除＋reload から Firebase signOut を行うコンポーネントに置換 */}
          <LogoutButton />
        </div>
      </aside>

      {/* 中央チャットビュー */}
      <main style={{ flex: 1, background: "#efefef", padding: 20, borderRadius: 8 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: 12 }}>
            <h2>AIの回答</h2>
            {currentAnswer ? (
              <div key="current-answer" style={{ padding: 20, background: "#fff", borderRadius: 16, fontSize: 20 }}>
                {currentAnswer}
              </div>
            ) : messages.filter(m => m.role === "ai").slice(-1).map(m => (
              <div key={m.id} style={{ padding: 20, background: "#fff", borderRadius: 16, fontSize: 20 }}>
                {m.text}
              </div>
            ))}
          </div>

          {/* 回答ナビゲーション */}
          {answerGroup && answerGroup.answers.length > 0 && (
            <div style={{ display: "flex", gap: 12, margin: "12px 0", alignItems: "center" }}>
              <button
                onClick={showPreviousAnswer}
                disabled={answerGroup.currentIndex === 0}
              >
                前の回答
              </button>
              <span style={{ fontSize: 14, color: "#666" }}>
                {answerGroup.currentIndex + 1} / {answerGroup.answers.length}
              </span>
              <button
                onClick={showNextAnswer}
                disabled={answerGroup.currentIndex === answerGroup.answers.length - 1}
              >
                次の回答
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
            <button onClick={() => markEvaluation(true)}>成功</button>
            <button onClick={() => markEvaluation(false)}>失敗</button>
            <button onClick={getAnotherAnswer} disabled={loading || !answerGroup}>
              {loading ? "生成中..." : "他の回答をもらう"}
            </button>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 8 }}>プロンプト</div>
            <textarea
              value={prompt}
              onChange={(e) => {
                if (selectedChat) {
                  setChatPrompts((prev) => ({
                    ...prev,
                    [selectedChat]: e.target.value,
                  }));
                }
              }}
              style={{ width: "100%", height: 140, borderRadius: 12, padding: 12 }}
              placeholder="要望や状況を入力して AI に相談"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={sendPrompt} disabled={loading}>
                {loading ? "送信中..." : "送信"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 右サイドバー (タグ等) */}
      <aside style={{ width: 180, background: "#f8f8f8", padding: 12, borderRadius: 8 }}>
        <h4>タグ一覧</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tags.map((t) => (
            <div key={t} style={{ background: "#fff", padding: 8, borderRadius: 8 }}>{t}</div>
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

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.3)", zIndex: 1000
    }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 10, width: 480 }}>
        <h3>新しいチャットを作成しましょう！</h3>
        <p>タイトルを入力してください。</p>
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%" }}
            placeholder="チャットのタイトル"
            autoFocus
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          {!isFirstChat && <button onClick={onClose}>キャンセル</button>}
          <button onClick={submit}>作成</button>
        </div>
      </div>
    </div>
  );
}