// バックエンドのAPIにアクセスし、生成された言い訳を取得して表示するコンポーネント
"use client";

import { useEffect, useState } from "react";
import { apifetch } from "@/app/lib/apiClient";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
export default function ExcuseComponent() {
    const [excuse, setExcuse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // バックエンドのAPIベースURLを環境変数から取得
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
        throw new Error("No NEXT_PUBLIC_API_BASE_URLが設定されていません");
    }

    // コンポーネントマウント時にAPIを呼び出して言い訳を取得
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                return;
            }

            // API呼び出し開始
            setLoading(true);
            // エラー状態リセット
            setError(null);

            // API呼び出し
            try {
                const res = await apifetch(`${API_URL}/gemini-test`);
                if (!res.ok) {
                    const text = await res.text();
                    console.error("API ERROR", res.status, text);
                    throw new Error("API呼び出し失敗");
                }

                const data = await res.json();
                setExcuse(data.excuse);
            } catch (e) {
                console.error("fetchエラー", e);
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [API_URL]);

    return (
        <div>
            {/*loadingがtrueの時に表示*/}
            {loading && <p>読み込み中…</p>}
            {/*errorがnullでなければ表示*/}
            {error && <p style={{ color: "red" }}>エラー: {error}</p>}
            {/*excuseがnullでなければ表示*/}
            {excuse && <p>言い訳: {excuse}</p>}
        </div>
    );
}
