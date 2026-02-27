import { apifetch } from "@/app/lib/apiClient";

// APIのベースURLを環境変数から取得
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL が設定されていません");
}

// ユーザー登録APIを呼び出す関数====================================================================
export const registerUser = async () => {

    const res = await apifetch((`${API_URL}/user/register`), {
        method: "POST",
    });

    const data = await res.json();

    return data;
};

// ユーザーの名前更新APIを呼び出す関数====================================================================
export const updateUserName = async (name: string) => {

    const res = await apifetch((`${API_URL}/user/update`), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: name }),
    });

    const data = await res.json();
    console.log("update name result:", data);
    return data;
}


// ユーザー情報取得APIを呼び出す関数====================================================================
export const fetchUser = async () => {

    const res = await apifetch((`${API_URL}/user/me`), {
        method: "GET",
    })
    const data = await res.json();
    return data.nickname;
}