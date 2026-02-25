import { apifetch } from "../lib/apiClient";

export interface Tag {
  id?: string;
  title: string;
  isSystemTag?: boolean;
  userId?: string | null;
  user?: { id: string; nickname: string | null; email: string } | null;
  isDeleted?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface TagResponse {
  id: string;
  title: string;
  isSystemTag?: boolean;
  userId?: string | null;
  user?: { id: string; nickname: string | null; email: string } | null;
  isDeleted?: boolean;
}

/**
 * タグ一覧を取得
 */
export const fetchTags = async (): Promise<Tag[]> => {
  if (!API_URL) {
    throw new Error("API URLが未設定です");
  }

  const res = await apifetch(`${API_URL}/tags`, {}, true);
  if (!res.ok) {
    throw new Error("タグ取得に失敗しました");
  }

  const data = await res.json();
  return ((data.tags || []) as TagResponse[]).map((tag) => ({
    id: tag.id,
    title: tag.title,
    isSystemTag: tag.isSystemTag ?? false,
    userId: tag.userId ?? null,
    user: tag.user ?? null,
    isDeleted: tag.isDeleted ?? false,
  }));
};


