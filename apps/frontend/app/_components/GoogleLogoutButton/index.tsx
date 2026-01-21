// Googleログアウトボタン
"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";


export default function LogoutButton() {
    const router = useRouter();

    const logoutWithGoogle = async () => {
        await signOut(auth);
        router.push("/");
    };

    return (
        <button onClick={logoutWithGoogle}>
            ログアウト
        </button>
    );
}
