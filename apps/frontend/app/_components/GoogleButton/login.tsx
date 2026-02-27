// Googleログインボタン
"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/app/lib/firebase";
// ページ遷移用フック
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/api/user";
import styles from "../../login/page.module.css";

export default function GoogleLoginButton() {
    const router = useRouter();

    // Googleログイン処理
    const loginWithGoogle = async () => {

            // ポップアップでGoogleログインを実行
        try {
            const cred = await signInWithPopup(auth, provider);
            const token = await cred.user.getIdToken();
            localStorage.setItem("idToken", token);

            // ユーザー登録
            const result = await registerUser();

            // ===== ここで分岐 =====
            if (result.isNewUser) {
                // 初回ログイン → 名前設定ページ
                router.replace("/username");
            } else {
                // 既存ユーザー → ルート
                router.replace("/chat");
            }

        } catch (error) {
            console.error("ログイン失敗", error);
        }
    };

    return (
        <div className={styles.googleLogin}>
            <button className={styles.googleBtn} onClick={loginWithGoogle}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Googleでログイン
            </button>
        </div>
    );
}