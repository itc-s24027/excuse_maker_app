"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
// import GeminiIntegration from "./_components/gemini/GeminiInteraction";
// import LogoutButton from "@/app/_components/GoogleLogoutButton";
// import LoginButton from "@/app/_components/GoogleLoginButton";
import ChatPage from "./chat/page";

export default function Home() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    // ユーザーが未ログインの場合、ログインページへリダイレクト
    useEffect(() => {
        if (loading) return // ローディング中は何もしない
        if (!user) router.replace("/login");
    }, [loading, user, router]);

    if (loading) return <p>読み込み中...</p>;
    if (!user) return null; // リダイレクト中

    return <ChatPage />;
}