// Googleログアウトボタン
"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";


export default function LogoutButton() {
    const router = useRouter();

    const logoutWithGoogle = async () => {
        await signOut(auth);
        // localStorage のトークンを削除
        localStorage.removeItem("idToken");
        router.push("/login");
    };

    return (
        <button
            onClick={logoutWithGoogle}
            style={{
                padding: "12px 16px",
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "#fff",
                background: "#665440",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "#9a6044";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "#665440";
            }}
        >
            ログアウト
        </button>
    );
}
