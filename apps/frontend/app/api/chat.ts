import { apifetch } from "../lib/apiClient";

export interface ChatSummary {
  id: string;
  title: string;
}

export interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

export interface TagInfo {
  excuseId: string;
  tagId: string;
  tag?: { id: string; title: string };
}

export interface Answer {
  text: string;
  deleted: boolean;
  success: boolean;
  excuseId: string;
  tags?: TagInfo[];
}

export interface AnswerGroup {
  promptId: string;
  prompt: string;
  answers: Answer[];
  currentIndex: number;
}

interface ExcusePromptResponse {
  id: string;
  situation: string;
  answers?: Array<{
    excuseText: string;
    isDeleted?: boolean;
    success?: boolean;
  }>;
}

interface ExcuseResponse {
  id: string;
  excuseText: string;
  situation?: string;
  isDeleted?: boolean;
  success?: boolean;
  tags?: TagInfo[];
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_URL) {
  console.error("APIのURLが設定されていません");
}

/**
 * ユーザーのチャットリストを取得
 */
export const fetchChats = async (): Promise<ChatSummary[]> => {
  if (!API_URL) throw new Error("API URLが未設定です");

  const response = await apifetch(`${API_URL}/chats/user`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`チャットリスト取得エラー: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data.map((chat: any) => ({
      id: chat.id,
      title: chat.title,
    }));
  }

  return [];
};

/**
 * チャットの詳細情報を取得
 */
export const fetchChatDetail = async (
  chatId: string,
  signal?: AbortSignal
): Promise<AnswerGroup[]> => {
  if (!API_URL) throw new Error("API URLが未設定です");

  const response = await apifetch(`${API_URL}/chats/${chatId}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error(`チャット詳細取得エラー: ${response.status}`);
  }

  const chatDetail = await response.json();
  let answerGroups: AnswerGroup[] = [];

  // 新スキーマ（ExcusePrompt/ExcuseAnswer）をチェック
  if (
    chatDetail.excusePrompts &&
    Array.isArray(chatDetail.excusePrompts) &&
    chatDetail.excusePrompts.length > 0
  ) {
    answerGroups = (chatDetail.excusePrompts as ExcusePromptResponse[]).map(
      (prompt, idx: number) => ({
        promptId: prompt.id || String(idx),
        prompt: prompt.situation || "",
        answers:
          prompt.answers && Array.isArray(prompt.answers)
            ? prompt.answers.map((answer) => ({
                text: answer.excuseText,
                deleted: answer.isDeleted || false,
                success: answer.success || false,
                excuseId: "",
              }))
            : [],
        currentIndex: 0,
      })
    );
  } else if (
    chatDetail.excuses &&
    Array.isArray(chatDetail.excuses) &&
    chatDetail.excuses.length > 0
  ) {
    console.log("チャット詳細取得:", chatDetail.excuses);

    // situationごとにExcuseをグループ化
    const groupedBySituation = (chatDetail.excuses as ExcuseResponse[]).reduce(
      (acc: Record<string, ExcuseResponse[]>, excuse) => {
        const situation = excuse.situation || "";
        if (!acc[situation]) {
          acc[situation] = [];
        }
        acc[situation].push(excuse);
        return acc;
      },
      {}
    );

    console.log("グループ化後:", groupedBySituation);

    answerGroups = Object.entries(groupedBySituation).map(
      ([situation, excuses], idx: number) => ({
        promptId: String(idx),
        prompt: situation,
        answers: excuses.map((excuse) => {
          const isDeleted = excuse.isDeleted || false;
          const success = excuse.success || false;
          console.log(`Excuse ${excuse.id}: isDeleted=${isDeleted}, success=${success}`);
          return {
            text: excuse.excuseText,
            deleted: isDeleted,
            success: success,
            excuseId: excuse.id,
            tags: excuse.tags || [],
          };
        }),
        currentIndex: 0,
      })
    );

    console.log("最終的なAnswerGroups:", answerGroups);
  }

  return answerGroups;
};

/**
 * 新しいチャットを作成
 */
export const createChat = async (title: string): Promise<ChatSummary> => {
  if (!API_URL) throw new Error("API URLが未設定です");

  const res = await apifetch(`${API_URL}/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  const data = JSON.parse(text);
  return {
    id: data.chat?.id ?? String(Date.now()),
    title: data.chat?.title ?? title,
  };
};

/**
 * チャットを削除
 */
export const deleteChat = async (chatId: string): Promise<void> => {
  if (!API_URL) throw new Error("API URLが未設定です");

  const response = await apifetch(`${API_URL}/chats/${chatId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`チャット削除エラー: ${response.status}`);
  }
};

/**
 * チャットのタイトルを更新
 */
export const updateChatTitle = async (
  chatId: string,
  title: string
): Promise<void> => {
  if (!API_URL) throw new Error("API URLが未設定です");

  const response = await apifetch(`${API_URL}/chats/${chatId}/title`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: title.trim() }),
  });

  if (!response.ok) {
    throw new Error(`タイトル更新エラー: ${response.status}`);
  }
};

/**
 * AIに相談（言い訳生成）
 */
export const generateExcuse = async (
  chatId: string,
  situation: string
): Promise<{ excuse: string; excuseId: string }> => {
  if (!API_URL) throw new Error("API URLが未設定です");

  const url = `${API_URL}/gemini-test`;
  const res = await apifetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chatId,
      situation,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI呼び出し失敗: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    excuse: data?.excuse ?? "AIの応答に失敗しました",
    excuseId: data?.excuseId || "",
  };
};

/**
 * 言い訳に成功フラグを付与
 */
export const markExcuseAsSuccess = async (
  chatId: string,
  excuseId: string,
  success: boolean
): Promise<void> => {
  if (!API_URL) throw new Error("API URLが未設定です");

  const response = await apifetch(`${API_URL}/chats/${chatId}/evaluation`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ excuseId, success }),
  });

  if (!response.ok) {
    throw new Error(`成功フラグ保存エラー: ${response.status}`);
  }
};

/**
 * 言い訳の表示/非表示を切り替え
 */
export const toggleExcuseVisibility = async (
  chatId: string,
  excuseId: string,
  isDeleted: boolean
): Promise<void> => {
  if (!API_URL) throw new Error("API URLが未設定です");

  const response = await apifetch(`${API_URL}/chats/${chatId}/visibility`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ excuseId, isDeleted }),
  });

  if (!response.ok) {
    throw new Error(`表示/非表示切り替えエラー: ${response.status}`);
  }
};

/**
 * 言い訳を保存（タグ付き）
 */
export const saveExcuse = async (
  chatId: string,
  excuseText: string,
  situation: string,
  tagIds: string[]
): Promise<void> => {
  if (!API_URL) throw new Error("API URLが未設定です");

  const res = await apifetch(`${API_URL}/chats/${chatId}/excuses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      excuseText,
      situation,
      tagIds,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`保存に失敗しました: ${errorText}`);
  }
};

