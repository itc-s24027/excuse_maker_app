import { useEffect, useState } from "react";
import { apifetch } from "./apiClient";

interface CurrentUser {
  id: string;
  uid: string;
  email: string;
  nickname: string | null;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_URL) {
          console.error("API URLが未設定です");
          setLoading(false);
          return;
        }

        const res = await apifetch(`${API_URL}/user/me`);
        if (!res.ok) {
          console.error("ユーザー情報取得に失敗しました");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setCurrentUser(data);
      } catch (err) {
        console.error("ユーザー情報取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return { currentUser, loading };
}

