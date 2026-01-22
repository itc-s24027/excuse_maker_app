// ログインページ
"use client";

import { auth} from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect } from "react";
import LoginButton from "@/app/_components/GoogleLoginButton";

export default function SignInPage() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    // ユーザーがログイン済みの場合、ホームにリダイレクト
    useEffect(() => {
        if (!loading && user) {
            router.push("/");
        }
    }, [loading, user, router]);

    if (loading) {
        return <p>読み込み中...</p>;
    }

    return (
        <>
            <h1>ログイン</h1>
            <p>ログインしてください</p>
            <LoginButton />
        </>
    );
}