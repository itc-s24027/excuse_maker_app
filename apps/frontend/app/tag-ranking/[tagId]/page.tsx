"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apifetch } from "@/app/lib/apiClient";
import { useCurrentUser } from "@/app/lib/useCurrentUser";
import styles from "./page.module.css";

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
    user: {
      id: string;
      nickname: string | null;
    };
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
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showSidebar, setShowSidebar] = useState(false); // ハンバーガーメニューの状態

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

    // すべてのタグを取得
    const fetchAllTags = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_URL) return;

        const res = await apifetch(`${API_URL}/tags`);
        if (res.ok) {
          const data = await res.json();
          setAllTags(data.tags || []);
        }
      } catch (err) {
        console.error("タグ一覧取得エラー:", err);
      }
    };

    fetchData();
    fetchAllTags();
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
      <div className={styles.loading}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p className={styles.errorText}>エラー: {error}</p>
        <Link href="/chat" className={styles.errorLink}>チャットに戻る</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 20, padding: 20, minHeight: "100vh", background: "var(--primary-bg)" }} className={styles.mainContainer}>
      {/* ハンバーガーボタン */}
      <button
        className={styles.hamburgerButton}
        onClick={() => setShowSidebar(!showSidebar)}
      >
        ⋮
      </button>

      {/* メインコンテンツ */}
      <main style={{ flex: 1 }} className={styles.mainContent}>
        <div className={styles.container} style={{ maxWidth: "100%", margin: 0, padding: 0 }}>
          {/* ヘッダー */}
          <div className={styles.header}>
            <Link href="/chat" className={styles.backLink}>
              <img
                src="/矢印1.png"
                alt="矢印アイコン"
                className={styles.backIcon}
              />
              チャットに戻る
            </Link>
            {tag && (
              <div className={styles.tagHeader}>
                <img
                  src="/タグアイコン9.png"
                  alt="タグアイコン"
                  className={styles.tagIcon}
                />
                <h1 className={styles.tagTitle}>
                  {tag.title}
                </h1>
              </div>
            )}
            <p className={styles.excuseCount}>
              {excuses.length}件の言い訳が見つかりました
            </p>
          </div>

          {/* 言い訳一覧 */}
          {excuses.length > 0 ? (
            <div className={styles.excuseList}>
              {excuses.map((excuse, idx) => {
                const isLiked = likedExcuses.has(excuse.id);
                return (
                  <div
                    key={excuse.id}
                    className={styles.excuseItem}
                  >
                    {/* ランキング番号（左側） */}
                    <div className={styles.rankingNumber}>
                      {idx + 1}
                    </div>

                    {/* 言い訳カード */}
                    <div className={styles.excuseCard}>
                      {/* 言い訳テキスト */}
                      <div className={styles.excuseTextContainer}>
                        <img
                          src="/猫アイコン1.png"
                          alt="AIの言い訳"
                          className={styles.catIcon}
                        />
                        <p className={styles.excuseText}>
                          {excuse.excuseText}
                        </p>
                      </div>

                      {/* メタ情報 */}
                      <div className={styles.metaInfo}>
                        <img
                          src="/状況.png"
                          alt="状況アイコン"
                          className={styles.situationIcon}
                        />
                        <div>
                          状況: <span className={styles.situationText}>{excuse.situation || "未入力"}</span>
                        </div>
                      </div>

                      {/* チャット情報といいねボタン */}
                      <div className={styles.cardFooter}>
                        <div style={{ flex: 1 }}>
                          <div className={styles.chatInfo}>
                            チャットタイトル: <span className={styles.chatTitle}>{excuse.chat.title}</span>
                          </div>
                          <div className={styles.chatInfo}>
                            ユーザー: <span className={styles.chatTitle}>{excuse.chat.user.nickname || "匿名ユーザー"}</span>
                          </div>
                          <div className={styles.createdDate}>
                            {new Date(excuse.createdAt).toLocaleDateString("ja-JP")}
                          </div>
                        </div>

                        {/* いいねボタン（猫の手アイコン） */}
                        <div className={styles.likeContainer}>
                          <button
                            onClick={() => handleLike(excuse.id)}
                            className={`${styles.likeButton} ${isLiked ? styles.liked : ""}`}
                          >
                            <img
                              src="/猫の手のフリー素材1.png"
                              alt="いいね"
                              className={`${styles.likeIcon} ${isLiked ? styles.liked : ""}`}
                            />
                            <span className={`${styles.likeCount} ${isLiked ? styles.liked : ""}`}>
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
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>このタグに関連する言い訳はまだありません</p>
            </div>
          )}
        </div>
      </main>

      {/* サイドバー - タグ一覧 */}
      <aside className={`${styles.sidebar} ${showSidebar ? styles.open : ''}`} style={{
        width: 280,
        background: "#fff6e9",
        padding: 16,
        borderRadius: 12,
        border: "2px solid #c3af96",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        gap: 12,
        height: "fit-content",
        position: "sticky",
        top: 20,
      }}>
        <h3 style={{
          fontSize: "0.9rem",
          fontWeight: "700",
          color: "#665440",
          margin: "0 0 8px 0",
        }}>
          タグ一覧
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {allTags.length > 0 ? (
            allTags.map((t) => (
              <Link
                key={t.id}
                href={`/tag-ranking/${t.id}`}
                style={{
                  background: t.id === tag?.id ? "#c3af96" : "#fff",
                  color: t.id === tag?.id ? "#fff" : "#665440",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #dfc9ab",
                  fontWeight: t.id === tag?.id ? "600" : "500",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (t.id !== tag?.id) {
                    e.currentTarget.style.background = "#e8d4c0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (t.id !== tag?.id) {
                    e.currentTarget.style.background = "#fff";
                  }
                }}
              >
                {t.title}
              </Link>
            ))
          ) : (
            <p style={{
              fontSize: "0.85rem",
              color: "#9a6044",
              margin: 0,
              fontStyle: "italic",
            }}>
              タグがありません
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

