// Googleログインボタン
"use client";

import { signInWithPopup, } from "firebase/auth";
import { auth, provider } from "@/app/lib/firebase";
// ページ遷移用フック
import { useRouter } from "next/navigation";

export default function GoogleLoginButton() {

    const router = useRouter();

    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, provider);
            router.replace("/");
        } catch (error) {
            console.error("ログイン失敗", error);
        }
    };

    return (
        <button onClick={loginWithGoogle}>
            Googleでログイン
        </button>
    );
}