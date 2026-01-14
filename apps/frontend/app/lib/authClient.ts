// トークンをバックエンドに送信して認証する関数

import { auth } from "./firebase";

export const authenticateWithBackend = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        throw new Error("Backend authentication failed");
    }

    return res.json();
};
