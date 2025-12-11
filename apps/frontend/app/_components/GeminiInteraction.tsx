"use client";

import { useEffect, useState } from "react";
export default function ExcuseComponent() {
    const [excuse, setExcuse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    useEffect(() => {
        async function fetchExcuse() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_URL}/api/gemini-test`);
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
    }, []);
    return (
        <div>
            {loading && <p>読み込み中…</p>}
            {error && <p style={{ color: "red" }}>エラー: {error}</p>}
            {excuse && <h1>言い訳: {excuse}</h1>}
        </div>
    );
}
