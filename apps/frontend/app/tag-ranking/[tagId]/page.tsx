"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apifetch } from "@/app/lib/apiClient";
import { useCurrentUser } from "@/app/lib/useCurrentUser";

interface Excuse {
  id: string;
  excuseText: string;
  situation: string;
  success: boolean;
  createdAt: string;
  likeCount: number;
  likes: Array<{
    id: string;
    userId: string;
  }>;
  chat: {
    id: string;
    title: string;
  };
}

interface Tag {
  id: string;
  title: string;
}

export default function TagRankingPage({ params }: { params: Promise<{ tagId: string }> }) {
  const [tag, setTag] = useState<Tag | null>(null);
  const [excuses, setExcuses] = useState<Excuse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useCurrentUser();
  const [likedExcuses, setLikedExcuses] = useState<Set<string>>(new Set());

  // paramsをアンラップ（コンポーネント直下で呼び出し）
  const resolvedParams = React.use(params);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

        if (!API_URL) {
          throw new Error("API URLが未設定です");
        }

        // タグ情報と関連する言い訳を取得
        const res = await apifetch(`${API_URL}/tags/${resolvedParams.tagId}/excuses`);

        if (!res.ok) {
          throw new Error("データ取得に失敗しました");
        }

        const data = await res.json();

        // タグ情報を直接レスポンスから取得
        if (data.tag) {
          setTag(data.tag);
        }

        // 言い訳を設定
        const excusesData = data.excuses || [];
        setExcuses(excusesData);

        // ユーザーがいいねした言い訳を特定
        if (currentUser) {
          const liked = new Set<string>();
          excusesData.forEach((excuse: Excuse) => {
            if (excuse.likes?.some((like) => like.userId === currentUser.id)) {
              liked.add(excuse.id);
            }
          });
          setLikedExcuses(liked);
        }
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError(err instanceof Error ? err.message : "データ取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams, currentUser]);

  const handleLike = async (excuseId: string) => {
    if (!currentUser) {
      alert("ログインが必要です");
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) return;

    try {
      const isLiked = likedExcuses.has(excuseId);
      const method = isLiked ? "DELETE" : "POST";
      const endpoint = `${API_URL}/chats/excuses/${excuseId}/like`;

      const res = await apifetch(endpoint, {
        method,
      });

      if (!res.ok) {
        throw new Error("いいね処理に失敗しました");
      }

      // UI を更新
      const newLiked = new Set(likedExcuses);
      if (isLiked) {
        newLiked.delete(excuseId);
      } else {
        newLiked.add(excuseId);
      }
      setLikedExcuses(newLiked);

      // 言い訳のいいね数を更新
      setExcuses((prev) =>
        prev.map((excuse) => {
          if (excuse.id === excuseId) {
            return {
              ...excuse,
              likeCount: isLiked ? excuse.likeCount - 1 : excuse.likeCount + 1,
            };
          }
          return excuse;
        })
      );
    } catch (err) {
      console.error("いいね処理エラー:", err);
      alert("いいね処理に失敗しました");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: "red" }}>エラー: {error}</p>
        <Link href="/chat">チャットに戻る</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 30 }}>
        <Link href="/chat" style={{ marginRight: 10, color: "#665440", textDecoration: "none" }}>
          <img
            src="/矢印1.png"
            alt="矢印アイコン"
            style={{ width: 20, height: 20, marginBottom: -4, marginRight: 6 }}
          />
          チャットに戻る
        </Link>
        {tag && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <img
              src="/タグアイコン9.png"
              alt="タグアイコン"
              style={{ width: 28, height: 28, paddingTop: 2 }}
            />
            <h1 style={{ margin: 0, color: "#625649" }}>
              {tag.title}
            </h1>
          </div>
        )}
        <p style={{ color: "#666", fontSize: 14 }}>
          {excuses.length}件の言い訳が見つかりました
        </p>
      </div>

      {/* 言い訳一覧 */}
      {excuses.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {excuses.map((excuse, idx) => {
            const isLiked = likedExcuses.has(excuse.id);
            return (
              <div
                key={excuse.id}
                style={{
                  display: "flex",
                  gap: 15,
                  alignItems: "flex-start",
                }}
              >
                {/* ランキング番号（左側） */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#4CAF50",
                    color: "#fff",
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    fontWeight: "bold",
                    fontSize: 20,
                    flexShrink: 0,
                    marginTop: 5,
                  }}
                >
                  {idx + 1}
                </div>

                {/* 言い訳カード */}
                <div
                  style={{
                    flex: 1,
                    padding: 20,
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 3,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* 言い訳テキスト */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <img
                      src="/猫アイコン1.png"
                      alt="AIの言い訳"
                      style={{
                        width: 35,
                        height: 35,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <p
                      style={{
                        fontSize: 20,
                        fontWeight: 500,
                        lineHeight: 1.6,
                        paddingTop: 3,
                      }}
                    >
                      {excuse.excuseText}
                    </p>
                  </div>

                  {/* メタ情報 */}
                  <div
                    style={{
                      display: "flex",
                      gap: 9,
                      fontSize: 15,
                      color: "#666",
                      marginBottom: 10,
                    }}
                  >
                    <img
                      src="/状況.png"
                      alt="状況アイコン"
                      style={{
                        width: 25,
                        height: 25,
                        marginLeft: 4,
                        filter: "grayscale(100%)",
                      }}
                    />
                    <div>
                      状況: <span style={{ color: "#333" }}>{excuse.situation || "未入力"}</span>
                    </div>
                  </div>

                  {/* チャット情報といいねボタン */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 10,
                      borderTop: "1px solid #eee",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, color: "#999", marginBottom: 5 }}>
                        チャットタイトル: <span style={{ color: "#666" }}>{excuse.chat.title}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#999" }}>
                        {new Date(excuse.createdAt).toLocaleDateString("ja-JP")}
                      </div>
                    </div>

                    {/* いいねボタン（猫の手アイコン） */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => handleLike(excuse.id)}
                        style={{
                          background: isLiked ? "rgba(217,141,118,0.63)" : "#ffffff",
                          border: "#999999",
                          cursor: "pointer",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.2s ease",
                          borderRadius: "8px",
                          opacity: 1,
                        }}
                      >
                        <img
                          src="/猫の手のフリー素材1.png"
                          alt="いいね"
                          style={{
                            width: 24,
                            height: 24,
                            filter: isLiked ? "none" : "grayscale(50%)",
                            transition: "all 0.2s ease",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: isLiked ? "#5c5c5c" : "#999",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {excuse.likeCount}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: "#f9f9f9",
            borderRadius: 8,
            color: "#999",
          }}
        >
          <p>このタグに関連する言い訳はまだありません</p>
        </div>
      )}
    </div>
  );
}

