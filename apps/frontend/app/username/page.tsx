"use client";

import { useState } from "react";
import { updateUserName } from "@/app/api/user";
import { useRouter } from "next/navigation";

export default function NicknameForm() {
    const router = useRouter();
    const [username, setUsername] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateUserName(username);
            router.replace("/");
        } catch (error) {
            console.error("ユーザー名更新失敗", error);
        }
    };

    return (
        <>
        <h1>ユーザー名設定ページ</h1>
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                />
            <button type="submit">決定</button>
        </form>
        </>
    );
}