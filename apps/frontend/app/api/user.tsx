import { apifetch } from "@/app/lib/apiClient";

export const registerUser = async () => {

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL が設定されていません");
    }

    const res = await apifetch((`${API_URL}/auth/register`), {
        method: "POST",
    });

    const data = await res.json();
    console.log("register result:", data);
};