// バックエンドのAPIにアクセスし、生成された言い訳を取得して表示するコンポーネント
"use client";

import { useEffect, useState } from "react";
export default function ExcuseComponent() {
    const [excuse, setExcuse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
        throw new Error("No NEXT_PUBLIC_API_BASE_URLが設定されていません");
    }

    useEffect(() => {
        async function fetchExcuse() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_URL}/gemini-test`);
                if (!res.ok) throw new Error("API呼び出し失敗");
                const data = await res.json();
                setExcuse(data.excuse);
            } catch (e) {
                console.error("fetchエラー", e);
                if (e instanceof Error) {
                    setError(e.message);
                } else {
                    setError(String(e));
                }
            } finally {
                setLoading(false);
            }
        }
        fetchExcuse();
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
