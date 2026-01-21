"use client";

import { auth } from "@/app/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import GeminiIntegration from "./_components/gemini/GeminiInteraction";
import LogoutButton from "@/app/_components/GoogleLogoutButton";
import LoginButton from "@/app/_components/GoogleLoginButton";

export default function Home() {
    const [user, loading] = useAuthState(auth);

    if (loading) {
        return <p>読み込み中...</p>;
    }

    if (!user) {
        return (
            <>
                <p>ログインしてください</p>
                <LoginButton />
            </>
        )
    }

    return (
        <main>
            <h1>言い訳を生成</h1>
            <p>
                hello：
                <strong>{user.displayName}</strong>
            </p>

            <p>メールアドレス：{user.email}</p>
            <GeminiIntegration />
            <LogoutButton />
        </main>
    );
}