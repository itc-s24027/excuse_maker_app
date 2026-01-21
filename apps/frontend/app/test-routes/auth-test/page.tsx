// トークン送信テスト用ページ
"use client";

import { useState } from "react";
import { apifetch } from "@/app/lib/apiClient";

type AuthTestResponse = {
    message: string;
    receivedAuthorization: string | null;
};

export default function AuthTestPage() {
    const [result, setResult] = useState<AuthTestResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL が設定されていません");
    }

    const handleTest = async () => {
        setError(null);

        try {
            const res = await apifetch(`${API_URL}/test/auth-test`);

            if (!res.ok) {
                throw new Error(`APIエラー: ${res.status}`);
            }

            const data = await res.json();
            setResult(data);
        } catch (e) {
            console.error(e);
            setError(
                e instanceof Error ? e.message : "不明なエラー"
            );
        }
    };

    return (
        <main>
            <h1>Auth Test</h1>

            {/*送信ボタン*/}
            <button onClick={handleTest}>
                トークン送信テスト
            </button>

            {/*エラーがある場合*/}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/*成功した場合*/}
            {result && (
                <p style={{ color: "green" }}>
                    トークン送信成功
                </p>
            )}

        </main>
    );
}
