// Googleログインボタン
"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/app/lib/firebase";
// ページ遷移用フック
import { useRouter } from "next/navigation";

export default function GoogleLoginButton() {
    const router = useRouter();

    // Googleログイン処理
    const loginWithGoogle = async () => {
        try {
            // ポップアップでGoogleログインを実行
            const cred = await signInWithPopup(auth, provider);
            // Firebase ユーザーから ID token を取得して localStorage に保存
            const token = await cred.user.getIdToken();
            localStorage.setItem("idToken", token);
            // ログイン成功後、ホームページへリダイレクト
            router.replace("/");
        } catch (error) {
            // エラーハンドリング
            console.error("ログイン失敗", error);
        }
    };

    return (
        <button onClick={loginWithGoogle}>
            Googleでログイン
        </button>
    );
}