// Googleログインボタン
"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/app/lib/firebase";
// ページ遷移用フック
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/api/user";

export default function GoogleLoginButton() {
    const router = useRouter();

    // Googleログイン処理
    const loginWithGoogle = async () => {

            // ポップアップでGoogleログインを実行
        try {
            const cred = await signInWithPopup(auth, provider);
            const token = await cred.user.getIdToken();
            localStorage.setItem("idToken", token);

            // ユーザー登録APIを呼び出し
            await registerUser();

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