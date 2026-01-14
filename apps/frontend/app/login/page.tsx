"use client";

import { auth, provider } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect } from "react";
import LoginButton from "@/app/_components/GoogleLoginButton";

export default function SignInPage() {
    const [user] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    return (
        <>
            <h1>ログインページ</h1>
            <LoginButton />
        </>
    );
}

