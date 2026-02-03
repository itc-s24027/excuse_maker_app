// TypeScript (tsx)
"use client";

import React, { useEffect, useState } from "react";

/*
  シンプルなチャット画面サンプル。
  - 左: ChatList + Create ボタン（モーダル）
  - 中央: ChatView (AI回答バブル、成功/失敗ボタン、プロンプト入力)
  - 右: TagList
*/

type ChatSummary = { id: string; title: string };
type Message = { id: string; role: "user" | "ai"; text: string };

export default function ChatPage() {
  const [chats, setChats] = useState<ChatSummary[]>([
    { id: "1", title: "履歴1" },
    { id: "2", title: "履歴2" },
  ]);
  const [selectedChat, setSelectedChat] = useState<string | null>(chats[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [tags] = useState<string[]>(["遅刻", "学校", "仕事"]);

  useEffect(() => {
    // ダミーで既存の会話を読み込む
    setMessages([
      { id: "m1", role: "ai", text: "ようこそ。要望を入力してください" },
    ]);
  }, [selectedChat]);

  // メッセージ追加ヘルパー
  const addMessage = (m: Message) => setMessages((s) => [...s, m]);

  // プロンプト送信処理
  const sendPrompt = async () => {
    if (!prompt.trim()) return; // 空入力は無視

    // ユーザーメッセージ追加
    const userMsg: Message = { id: String(Date.now()), role: "user", text: prompt }; // 仮ID
    addMessage(userMsg); // ユーザーメッセージ追加
    setPrompt(""); // 入力欄クリア

    // AI 呼び出し前の準備
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
      addMessage({ id: String(Date.now() + 2), role: "ai", text: "サーバーURLが未設定です" });
      return;
    }

    // AI 呼び出し（モックエンドポイント例）
    try {
      const token = localStorage.getItem("idToken") ?? "";
      const url = `${API_URL}/gemini-test?situation=${encodeURIComponent(userMsg.text)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // 認証ヘッダー
        },
      });

      // エラーハンドリング
      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR", res.status, text);
        throw new Error("AI呼び出しに失敗しました");
      }

      const data = await res.json();
      const aiText = data?.excuse ?? "AIの応答（モック）";
      addMessage({ id: String(Date.now() + 1), role: "ai", text: aiText });
    } catch (e) {
      console.error("fetchエラー", e);
      addMessage({ id: String(Date.now() + 2), role: "ai", text: "AI呼び出しに失敗しました" });
    }
  };

  const markEvaluation = async (success: boolean | null) => {
    // ここでは最新の AI 回答を評価する（API 呼び出しは省略）
    console.log("評価:", success);
  };

  const createChat = async (title: string, situation: string, tags: string[]) => {
    // POST /api/chats の呼び出し例
    try {
      const token = localStorage.getItem("idToken") ?? "";
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, situation, tags }),
      });
      if (!res.ok) throw new Error("作成失敗");
      const data = await res.json();
      // 作成したチャットを一覧に追加して選択
      const newChat: ChatSummary = { id: data.chat?.id ?? String(Date.now()), title: data.chat?.title ?? title };
      setChats((s) => [newChat, ...s]);
      setSelectedChat(newChat.id);
      setShowCreate(false);
    } catch (err) {
      console.error(err);
      alert("チャット作成に失敗しました");
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
          <button onClick={() => { localStorage.removeItem("idToken"); location.reload(); }}>ログアウト</button>
        </div>
      </aside>

      {/* 中央チャットビュー */}
      <main style={{ flex: 1, background: "#efefef", padding: 20, borderRadius: 8 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: 12 }}>
            <h2>AIの回答</h2>
            {messages.filter(m => m.role === "ai").slice(-1).map(m => (
              <div key={m.id} style={{ padding: 20, background: "#fff", borderRadius: 16, fontSize: 20 }}>
                {m.text}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
            <button onClick={() => markEvaluation(true)}>成功</button>
            <button onClick={() => markEvaluation(false)}>失敗</button>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 8 }}>プロンプト</div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ width: "100%", height: 140, borderRadius: 12, padding: 12 }}
              placeholder="要望や状況を入力して AI に相談"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={sendPrompt}>送信</button>
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
        <CreateModal onClose={() => setShowCreate(false)} onCreate={createChat} />
      )}
    </div>
  );
}

/* Create モーダル（簡易） */
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, situation: string, tags: string[]) => void }) {
  const [title, setTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [tagsText, setTagsText] = useState("");

  const submit = () => {
    const tags = tagsText.split(",").map(t => t.trim()).filter(Boolean);
    onCreate(title, situation, tags);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.3)", zIndex: 1000
    }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 10, width: 480 }}>
        <h3>チャット作成</h3>
        <div>
          <label>タイトル</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div>
          <label>状況</label>
          <textarea value={situation} onChange={(e) => setSituation(e.target.value)} style={{ width: "100%", height: 100 }} />
        </div>
        <div>
          <label>タグ（カンマ区切り）</label>
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose}>キャンセル</button>
          <button onClick={submit}>作成</button>
        </div>
      </div>
    </div>
  );
}