"use client";

import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect } from "react";
import LoginButton from "@/app/_components/GoogleButton/login";

export default function SignInPage() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        // すでにログイン済みならトップへ
        if (user) {
            router.replace("/chat");
        }
    }, [user, loading, router]);

    if (loading) {
        return <p>読み込み中...</p>;
    }

    if (user) return null; // リダイレクト中

    return (
        <>
            <h1>ログイン</h1>
            <p>ログインしてください</p>
            <LoginButton />
        </>
    );
}
