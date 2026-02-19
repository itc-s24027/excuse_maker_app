"use client";

import { useState } from "react";
import { updateUserName } from "@/app/api/user";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function NicknameForm() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username.trim()) {
            setError("ユーザー名を入力してください");
            return;
        }

        setIsLoading(true);
        try {
            await updateUserName(username);
            router.replace("/chat");
        } catch (error) {
            console.error("ユーザー名更新失敗", error);
            setError("ユーザー名の更新に失敗しました。もう一度お試しください。");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                {/* ヘッダー */}
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        ユーザー名を設定
                    </h1>
                    <p className={styles.description}>
                        言い訳メーカーへようこそ！<br />
                        あなたのユーザー名を設定しましょう
                    </p>
                </div>

                {/* フォーム */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* 入力フィールド */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            ユーザー名
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="例: 言い訳職人"
                            disabled={isLoading}
                            className={styles.input}
                        />
                    </div>

                    {/* エラーメッセージ */}
                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    {/* ボタン */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={styles.button}
                    >
                        {isLoading ? "設定中..." : "ユーザー名を設定"}
                    </button>
                </form>

                {/* ヒントテキスト */}
                <p className={styles.hint}>
                    3〜20文字のユーザー名を設定できます
                </p>
            </div>
        </div>
    );
}