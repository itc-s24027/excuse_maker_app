// TypeScript (tsx)
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/app/_components/GoogleButton/logout";
import SaveExcuseModal from "@/app/_components/chat/SaveExcuseModal";
import { apifetch } from "../lib/apiClient";
import styles from "./page.module.css";

/*
  シンプルなチャット画面サンプル。
  - 左: ChatList + Create ボタン（モーダル）
  - 中央: ChatView (AI回答バブル、成功/失敗ボタン、プロンプト入力)
  - 右: TagList
*/

type ChatSummary = { id: string; title: string };
type Message = { id: string; role: "user" | "ai"; text: string };
type TagInfo = { excuseId: string; tagId: string; tag?: { id: string; title: string } };
type Answer = { text: string; deleted: boolean; success: boolean; excuseId: string; tags?: TagInfo[] };
type AnswerGroup = { promptId: string; prompt: string; answers: Answer[]; currentIndex: number };
type Tag = {
  id?: string;
  title: string;
  isSystemTag?: boolean;
  userId?: string | null;
  user?: { id: string; nickname: string | null; email: string } | null;
  isDeleted?: boolean;
};

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  // チャットID をキーにしてメッセージを管理
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  // チャットID をキーにしてプロンプトを管理
  const [chatPrompts, setChatPrompts] = useState<Record<string, string>>({});
  // チャットID をキーにして回答グループの履歴を管理（複数のプロンプトに対する回答グループ）
  const [chatAnswerHistory, setChatAnswerHistory] = useState<Record<string, AnswerGroup[]>>({});
  // 現在表示中の回答グループのインデックス
  const [currentGroupIndex, setCurrentGroupIndex] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false); // 初期状態は非表示、チャット読み込み後に制御
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccessHistory, setShowSuccessHistory] = useState(false); // 成功の履歴表示制御
  const [showHiddenAnswers, setShowHiddenAnswers] = useState<Record<string, boolean>>({}); // 非表示の回答表示制御
  const [deleteConfirmChatId, setDeleteConfirmChatId] = useState<string | null>(null); // 削除確認ダイアログで削除対象のチャットID
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null); // 三点リーダーメニューが開いているチャットID
  const [editTitleChatId, setEditTitleChatId] = useState<string | null>(null); // タイトル編集モーダルで編集対象のチャットID
  const [editTitleValue, setEditTitleValue] = useState(""); // タイトル編集モーダルの入力値
  const [chatWithTaggedExcuses, setChatWithTaggedExcuses] = useState<boolean>(false); // 削除対象チャットにタグ付き言い訳があるか
  const [showSidebar, setShowSidebar] = useState(false); // ハンバーガーメニューでサイドバー表示
  const [showRightSidebar, setShowRightSidebar] = useState(false); // ハンバーガーメニューで右サイドバー表示

  // SaveExcuseModal 用の状態
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lastExcuseText, setLastExcuseText] = useState("");

  // ポップアップ用の状態
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  // ポップアップを表示する関数
  const showAlert = (message: string) => {
    setPopupMessage(message);
    setShowPopup(true);
  };

  // 導出値: 現在選択されているチャットの情報
  const messages = selectedChat ? (chatMessages[selectedChat] ?? []) : [];
  const prompt = selectedChat ? (chatPrompts[selectedChat] ?? "") : (chatPrompts["temp-chat"] ?? "");
  const answerHistory = selectedChat ? (chatAnswerHistory[selectedChat] ?? []) : [];
  const currentGroupIdx = selectedChat ? (currentGroupIndex[selectedChat] ?? -1) : -1;
  const currentAnswerGroup = currentGroupIdx >= 0 ? answerHistory[currentGroupIdx] : null;
  // 削除されていない回答のみを取得
  const validAnswers = currentAnswerGroup ? currentAnswerGroup.answers.filter((a: Answer) => !a.deleted) : [];
  // 現在表示されている回答を取得：currentAnswerGroup内のcurrentIndexで指定された回答を表示
  // ただし、currentIndexはallAnswersのインデックスなので、validAnswersとのマッピングが必要
  const currentAnswerIndex = currentAnswerGroup ? currentAnswerGroup.currentIndex : -1;
  const currentAnswer = currentAnswerGroup && currentAnswerIndex >= 0 && currentAnswerIndex < currentAnswerGroup.answers.length
    ? (currentAnswerGroup.answers[currentAnswerIndex].deleted ? null : currentAnswerGroup.answers[currentAnswerIndex])
    : (validAnswers.length > 0 ? validAnswers[validAnswers.length - 1] : null);

  // チャットが選択された時に詳細情報を取得
  useEffect(() => {
    if (!selectedChat || chatMessages[selectedChat]) {
      // 既にメッセージが読み込まれている場合はスキップ
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    const loadChatDetail = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_URL) {
          console.error("APIのURLが設定されていません");
          return;
        }

        const response = await apifetch(`${API_URL}/chats/${selectedChat}`, {
          method: "GET",
          signal: abortController.signal,
        });

        if (!response.ok) {
          console.error("チャット詳細取得エラー:", response.status);
          return;
        }

        const chatDetail = await response.json();

        // コンポーネントがアンマウントされた場合は処理を中止
        if (!isMounted) return;

        // チャットのメッセージを初期化
        const initialMessages: Message[] = [
          { id: "m1", role: "ai", text: "ようこそ。要望を入力してください" },
        ];

        setChatMessages((prev) => ({
          ...prev,
          [selectedChat]: initialMessages,
        }));

        let answerGroups: AnswerGroup[] = [];

        // 新スキーマ（ExcusePrompt/ExcuseAnswer）をチェック
        if (chatDetail.excusePrompts && Array.isArray(chatDetail.excusePrompts) && chatDetail.excusePrompts.length > 0) {
          interface ExcusePromptResponse {
            id: string;
            situation: string;
            answers?: Array<{
              excuseText: string;
              isDeleted?: boolean;
              success?: boolean;
            }>;
          }

          answerGroups = (chatDetail.excusePrompts as ExcusePromptResponse[]).map((prompt, idx: number) => ({
            promptId: prompt.id || String(idx),
            prompt: prompt.situation || "", // プロンプト
            answers: prompt.answers && Array.isArray(prompt.answers)
              ? prompt.answers.map((answer) => ({
                  text: answer.excuseText, // AIの回答
                  deleted: answer.isDeleted || false, // 非表示フラグ
                  success: answer.success || false, // 成功フラグ
                  excuseId: "", // excuseIdは古いスキーマでのみ使用
                }))
              : [],
            currentIndex: 0,
          }));
        }
        // フォールバック：古いスキーマ（Excuse）から取得して、situationごとにグループ化
        else if (chatDetail.excuses && Array.isArray(chatDetail.excuses) && chatDetail.excuses.length > 0) {
          console.log("チャット詳細取得:", chatDetail.excuses);

          // 最初のExcuseレコードの詳細をログ
          if (chatDetail.excuses.length > 0) {
            console.log("最初のExcuseレコードの詳細:", {
              ...chatDetail.excuses[0],
              isDeleted: (chatDetail.excuses[0] as ExcuseResponse).isDeleted,
              success: (chatDetail.excuses[0] as ExcuseResponse).success,
            });
          }

          // situationごとにExcuseをグループ化
          interface ExcuseResponse {
            id: string;
            excuseText: string;
            situation?: string;
            isDeleted?: boolean;
            success?: boolean;
            tags?: TagInfo[];
          }

          const groupedBySituation = (chatDetail.excuses as ExcuseResponse[]).reduce((acc: Record<string, ExcuseResponse[]>, excuse) => {
            const situation = excuse.situation || "";
            if (!acc[situation]) {
              acc[situation] = [];
            }
            acc[situation].push(excuse);
            return acc;
          }, {});

          console.log("グループ化後:", groupedBySituation);

          // グループをAnswerGroupに変換
          const groupedExcuses = groupedBySituation as Record<string, ExcuseResponse[]>;
          answerGroups = Object.entries(groupedExcuses).map(([situation, excuses], idx: number) => ({
            promptId: String(idx),
            prompt: situation,
            answers: excuses.map((excuse) => {
              const isDeleted = excuse.isDeleted || false;
              const success = excuse.success || false;
              console.log(`Excuse ${excuse.id}: isDeleted=${isDeleted}, success=${success}`);
              return {
                text: excuse.excuseText, // AIの回答
                deleted: isDeleted,
                success: success,
                excuseId: excuse.id, // ExcuseIDを保存
                tags: excuse.tags || [], // タグ情報を保存
              };
            }),
            currentIndex: 0,
          }));

          console.log("最終的なAnswerGroups:", answerGroups);

          // 成功フラグが true のものをログ
          const successCount = answerGroups.reduce((count, group) => {
            return count + group.answers.filter(a => a.success && !a.deleted).length;
          }, 0);
          const hiddenCount = answerGroups.reduce((count, group) => {
            return count + group.answers.filter(a => a.deleted).length;
          }, 0);
          console.log(`成功数: ${successCount}, 非表示数: ${hiddenCount}`);
        }

        if (answerGroups.length > 0) {
          setChatAnswerHistory((prev) => ({
            ...prev,
            [selectedChat]: answerGroups,
          }));

          // 最後のプロンプトをプロンプト入力エリアに設定
          const lastPrompt = answerGroups[answerGroups.length - 1].prompt;
          setChatPrompts((prev) => ({
            ...prev,
            [selectedChat]: lastPrompt,
          }));

          // 最後の回答グループを表示
          setCurrentGroupIndex((prev) => ({
            ...prev,
            [selectedChat]: Math.max(0, answerGroups.length - 1),
          }));
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log("チャット詳細取得がキャンセルされました");
          return;
        }
        console.error("チャット詳細取得エラー:", error);
      }
    };

    loadChatDetail();

    // クリーンアップ関数：アンマウント時またはselectedChatが変更された時にリクエストをキャンセル
    return () => {
      isMounted = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  // ページマウント時にチャットリストを取得
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadChats = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_URL) {
          console.error("APIのURLが設定されていません");
          return;
        }

        const response = await apifetch(`${API_URL}/chats/user`, {
          method: "GET",
          signal: abortController.signal,
        });

        if (!response.ok) {
          console.error("チャットリスト取得エラー:", response.status);
          return;
        }

        const data = await response.json();

        // コンポーネントがアンマウントされた場合は処理を中止
        if (!isMounted) return;

        // データはChat[] の配列
        if (Array.isArray(data)) {
          interface ChatResponse {
            id: string;
            title: string;
          }
          const chatsFromDB = (data as ChatResponse[]).map((chat) => ({
            id: chat.id,
            title: chat.title,
          }));
          setChats(chatsFromDB);

          // 最初のチャットを自動選択
          if (chatsFromDB.length > 0) {
            setSelectedChat(chatsFromDB[0].id);
            setShowCreate(false);
          } else {
            // チャットがない場合は作成モーダルを表示
            setShowCreate(true);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log("チャットリスト取得がキャンセルされました");
          return;
        }
        console.error("チャットリスト取得エラー:", error);
      }
    };

    loadChats();

    // クリーンアップ関数
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // タグ一覧を取得する関数
  const fetchTags = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_URL) {
        console.error("API URLが未設定です");
        return;
      }

      const res = await apifetch(`${API_URL}/tags`, {}, true);
      if (!res.ok) {
        throw new Error("タグ取得に失敗しました");
      }

      const data = await res.json();
      interface TagResponse {
        id: string;
        title: string;
        isSystemTag?: boolean;
        userId?: string | null;
        user?: { id: string; nickname: string | null; email: string } | null;
        isDeleted?: boolean;
      }
      const fetchedTags: Tag[] = ((data.tags || []) as TagResponse[]).map((tag) => ({
        id: tag.id,
        title: tag.title,
        isSystemTag: tag.isSystemTag ?? false,
        userId: tag.userId ?? null,
        user: tag.user ?? null,
        isDeleted: tag.isDeleted ?? false,
      }));
      setTags(fetchedTags);
    } catch (err) {
      console.error("タグ取得エラー:", err);
    }
  };

  // コンポーネント初期化時にデータベースからタグを取得
  useEffect(() => {
    fetchTags();
  }, []);

  // SaveExcuseModal から保存処理
  const handleSaveExcuse = async (selectedTags: Tag[]) => {
    try {
      if (!selectedChat || !currentAnswer) {
        showAlert("チャットまたは言い訳が選択されていません");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_URL) {
        showAlert("API URLが未設定です");
        return;
      }

      // タグオブジェクト配列からIDを抽出
      const tagIds = selectedTags
        .map((tag) => tag.id)
        .filter((id): id is string => id !== undefined && id !== null);

      console.log("保存するタグID:", tagIds);

      // 言い訳を保存（複数タグ付き）
      const res = await apifetch(`${API_URL}/chats/${selectedChat}/excuses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          excuseText: currentAnswer.text,
          situation: prompt,
          tagIds: tagIds, // タグIDの配列
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`保存に失敗しました: ${errorText}`);
      }

      const data = await res.json();
      console.log("言い訳を保存しました:", data);

      setShowSaveModal(false);
      showAlert("言い訳を保存しました！");

      // 保存後にタグ一覧を再取得してランキングに反映させる
      await fetchTags();
    } catch (err) {
      console.error("言い訳保存エラー:", err);
      showAlert(err instanceof Error ? err.message : "言い訳の保存に失敗しました");
    }
  };

  // プロンプト送信処理
  const sendPrompt = async () => {
    if (!prompt.trim()) return; // 空入力は無視

    setLoading(true);

    let chatId = selectedChat;

    // チャットが選択されていない場合は「新規1」で自動作成
    if (!chatId) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_URL) {
          showAlert("サーバーURLが未設定です");
          setLoading(false);
          return;
        }

        const res = await apifetch(`${API_URL}/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: "新規1" }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("チャット作成エラー", res.status, text);
          showAlert("チャット作成に失敗しました");
          setLoading(false);
          return;
        }

        const data = await res.json();
        const newChat: ChatSummary = {
          id: data.chat?.id ?? String(Date.now()),
          title: data.chat?.title ?? "新規1",
        };

        // チャットリストに追加して選択
        setChats((prev) => [newChat, ...prev]);
        setSelectedChat(newChat.id);

        // 「temp-chat」に保存されたプロンプトを新しいチャットに移動
        const tempPrompt = chatPrompts["temp-chat"] ?? prompt;
        setChatPrompts((prev) => {
          const updated = { ...prev };
          delete updated["temp-chat"]; // temp-chatを削除
          updated[newChat.id] = tempPrompt; // 新しいチャットにプロンプトを保存
          return updated;
        });

        chatId = newChat.id;
      } catch (err) {
        console.error("チャット作成エラー:", err);
        showAlert("チャット作成に失敗しました");
        setLoading(false);
        return;
      }
    }

    // ユーザーメッセージ追加
    const userMsg: Message = { id: String(Date.now()), role: "user", text: prompt };
    if (chatId) {
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] ?? []), userMsg],
      }));
    }
    const promptId = String(Date.now());

    // AI 呼び出し前の準備
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
      if (chatId) {
        setChatMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), { id: String(Date.now() + 2), role: "ai", text: "サーバーURLが未設定です" }],
        }));
      }
      setLoading(false);
      return;
    }

    // AI 呼び出し（言い訳生成＋DB保存）
    try {
      const url = `${API_URL}/gemini-test`;
      const res = await apifetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId,
          situation: userMsg.text,
        }),
      });

      // エラーハンドリング
      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR", res.status, text);
        throw new Error("AI呼び出しに失敗しました");
      }

      const data = await res.json();
      const aiText = data?.excuse ?? "AIの応答に失敗しました";
      const excuseId = data?.excuseId; // バックエンドから返ってきたexcuseIdを取得

      // 新しい回答グループを作成
      const newAnswerGroup: AnswerGroup = {
        promptId,
        prompt: userMsg.text,
        answers: [{ text: aiText, deleted: false, success: false, excuseId: excuseId || "" }],
        currentIndex: 0,
      };

      // 回答グループ履歴に追加
      if (chatId) {
        setChatAnswerHistory((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), newAnswerGroup],
        }));

        // 新しい回答グループを表示
        setCurrentGroupIndex((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] ?? -1) + 1,
        }));

        setChatMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), { id: String(Date.now() + 1), role: "ai", text: aiText }],
        }));
      }
    } catch (e) {
      console.error("fetchエラー", e);
      const errorMsg = "AI呼び出しに失敗しました";
      if (chatId) {
        setChatMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] ?? []), { id: String(Date.now() + 2), role: "ai", text: errorMsg }],
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  // 成功を記録
  const markSuccess = async () => {
    if (!currentAnswerGroup || currentGroupIdx < 0 || !selectedChat || !currentAnswer) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_URL) {
        console.error("APIのURLが設定されていません");
        return;
      }

      // 現在表示されているExcuseIDを取得
      const currentIdx = currentAnswerIndex;
      console.log("markSuccess: currentIdx=", currentIdx, "currentAnswerGroup.answers=", currentAnswerGroup.answers);
      const excuseId = currentAnswerGroup.answers[currentIdx]?.excuseId;

      if (!excuseId) {
        console.error("ExcuseIDが見つかりません", { currentIdx, answers: currentAnswerGroup.answers });
        return;
      }

      console.log("markSuccess: excuseId=", excuseId);

      // API呼び出しでデータベースに保存
      const response = await apifetch(`${API_URL}/chats/${selectedChat}/evaluation`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ excuseId, success: true }),
      });

      if (!response.ok) {
        console.error("成功フラグ保存エラー:", response.status);
        return;
      }

      // ローカル状態にも成功フラグを保存
      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat] ?? [])];
        const groupIndex = currentGroupIdx;
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers];
          // 現在表示されている回答に成功フラグを立てる
          if (currentIdx >= 0 && currentIdx < newAnswers.length && !newAnswers[currentIdx].deleted) {
            newAnswers[currentIdx] = { ...newAnswers[currentIdx], success: true };
          }
          history[groupIndex] = { ...group, answers: newAnswers };
        }
        return { ...prev, [selectedChat]: history };
      });

      console.log("成功フラグを保存しました");
    } catch (error) {
      console.error("成功フラグ保存エラー:", error);
    }
  };

  // 回答を非表示（論理削除）
  const hideAnswer = async () => {
    if (!currentAnswerGroup || currentGroupIdx < 0 || !selectedChat || !currentAnswer) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_URL) {
        console.error("APIのURLが設定されていません");
        return;
      }

      // 現在表示されているExcuseIDを取得
      const currentIdx = currentAnswerIndex;
      console.log("hideAnswer: currentIdx=", currentIdx, "currentAnswerGroup.answers=", currentAnswerGroup.answers);
      const excuseId = currentAnswerGroup.answers[currentIdx]?.excuseId;

      if (!excuseId) {
        console.error("ExcuseIDが見つかりません");
        return;
      }

      // APIエンドポイントを呼び出して、isDeletedフラグを更新
      console.log("非表示フラグを保存します:", excuseId);

      const response = await apifetch(`${API_URL}/chats/${selectedChat}/visibility`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ excuseId, isDeleted: true }),
      });

      if (!response.ok) {
        console.error("非表示フラグ保存エラー:", response.status);
        return;
      }

      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat] ?? [])];
        const groupIndex = currentGroupIdx;
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers];
          // 現在表示されている回答を非表示にする
          if (currentIdx >= 0 && currentIdx < newAnswers.length) {
            newAnswers[currentIdx] = { ...newAnswers[currentIdx], deleted: true };
          }

          // 非表示後の次の削除されていない回答を探す
          let nextValidIdx = -1;
          for (let i = currentIdx + 1; i < newAnswers.length; i++) {
            if (!newAnswers[i].deleted) {
              nextValidIdx = i;
              break;
            }
          }

          // 次の回答がない場合は、前の削除されていない回答を探す
          if (nextValidIdx === -1) {
            for (let i = currentIdx - 1; i >= 0; i--) {
              if (!newAnswers[i].deleted) {
                nextValidIdx = i;
                break;
              }
            }
          }

          // 新しいcurrentIndexを設定（削除されていない回答がある場合）
          const newCurrentIndex = nextValidIdx >= 0 ? nextValidIdx : currentIdx;

          history[groupIndex] = { ...group, answers: newAnswers, currentIndex: newCurrentIndex };
        }
        return { ...prev, [selectedChat]: history };
      });
    } catch (error) {
      console.error("非表示フラグ保存エラー:", error);
    }
  };

  // 非表示を解除（論理削除を取り消す）
  const undoHideAnswer = async () => {
    if (!currentAnswerGroup || currentGroupIdx < 0 || !selectedChat || !currentAnswer) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_URL) {
        console.error("APIのURLが設定されていません");
        return;
      }

      // 現在表示されているExcuseIDを取得
      const currentIdx = currentAnswerIndex;
      const excuseId = currentAnswerGroup.answers[currentIdx]?.excuseId;

      if (!excuseId) {
        console.error("ExcuseIDが見つかりません");
        return;
      }

      // APIエンドポイントを呼び出して、isDeletedフラグを更新
      console.log("非表示を解除します:", excuseId);

      const response = await apifetch(`${API_URL}/chats/${selectedChat}/visibility`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ excuseId, isDeleted: false }),
      });

      if (!response.ok) {
        console.error("非表示解除エラー:", response.status);
        return;
      }

      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat] ?? [])];
        const groupIndex = currentGroupIdx;
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers];
          // 現在表示されている回答の削除フラグを解除
          if (currentIdx >= 0 && currentIdx < newAnswers.length) {
            newAnswers[currentIdx] = { ...newAnswers[currentIdx], deleted: false };
          }
          history[groupIndex] = { ...group, answers: newAnswers };
        }
        return { ...prev, [selectedChat]: history };
      });
    } catch (error) {
      console.error("非表示解除エラー:", error);
    }
  };

  // 成功をキャンセル
  const cancelSuccess = async (groupIndex: number, answerIndex: number) => {
    if (!selectedChat) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_URL) {
        console.error("APIのURLが設定されていません");
        return;
      }

      const history = chatAnswerHistory[selectedChat] ?? [];
      if (groupIndex >= 0 && groupIndex < history.length) {
        const group = history[groupIndex];
        if (answerIndex >= 0 && answerIndex < group.answers.length) {
          const excuseId = group.answers[answerIndex].excuseId;

          if (!excuseId) {
            console.error("ExcuseIDが見つかりません");
            return;
          }

          // API呼び出しでデータベースに保存
          console.log("成功フラグを取り消します:", excuseId);

          const response = await apifetch(`${API_URL}/chats/${selectedChat}/evaluation`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ excuseId, success: false }),
          });

          if (!response.ok) {
            console.error("成功フラグ取り消しエラー:", response.status);
            return;
          }
        }
      }

      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat] ?? [])];
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers];
          if (answerIndex >= 0 && answerIndex < newAnswers.length) {
            newAnswers[answerIndex] = { ...newAnswers[answerIndex], success: false };
          }
          history[groupIndex] = { ...group, answers: newAnswers };
        }
        return { ...prev, [selectedChat]: history };
      });
    } catch (error) {
      console.error("成功フラグ取り消しエラー:", error);
    }
  };

  // 非表示をキャンセル
  const cancelHide = (groupIndex: number, answerIndex: number) => {
    if (!selectedChat) return;

    setChatAnswerHistory((prev) => {
      const history = [...(prev[selectedChat] ?? [])];
      if (groupIndex >= 0 && groupIndex < history.length) {
        const group = history[groupIndex];
        const newAnswers = [...group.answers];
        if (answerIndex >= 0 && answerIndex < newAnswers.length) {
          newAnswers[answerIndex] = { ...newAnswers[answerIndex], deleted: false };
        }
        history[groupIndex] = { ...group, answers: newAnswers };
      }
      return { ...prev, [selectedChat]: history };
    });
  };

  // 非表示を見る切り替え
  const toggleShowHiddenAnswers = () => {
    if (!selectedChat) return;
    setShowHiddenAnswers((prev) => ({
      ...prev,
      [selectedChat]: !prev[selectedChat],
    }));
  };

  // 他の回答をもらう処理
  const getAnotherAnswer = async () => {
    if (!prompt.trim() || loading || !currentAnswerGroup || !selectedChat) return;

    setLoading(true);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) {
      setLoading(false);
      return;
    }

    try {
      const url = `${API_URL}/gemini-test`;
      const res = await apifetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: selectedChat,
          situation: prompt,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR", res.status, text);
        throw new Error("AI呼び出しに失敗しました");
      }

      const data = await res.json();
      const aiText = data?.excuse ?? "AIの応答に失敗しました";
      const excuseId = data?.excuseId; // バックエンドから返ってきたexcuseIdを取得

      // 現在の回答グループに新しい回答を追加
      setChatAnswerHistory((prev) => {
        const history = [...(prev[selectedChat!] ?? [])];
        const groupIndex = currentGroupIdx;
        if (groupIndex >= 0 && groupIndex < history.length) {
          const group = history[groupIndex];
          const newAnswers = [...group.answers, { text: aiText, deleted: false, success: false, excuseId: excuseId || "" }];
          // 新しい回答を追加し、currentIndexを最新の回答に更新
          history[groupIndex] = {
            ...group,
            answers: newAnswers,
            currentIndex: newAnswers.length - 1 // 最新の回答を指す
          };
        }
        return { ...prev, [selectedChat!]: history };
      });
    } catch (e) {
      console.error("fetchエラー", e);
    } finally {
      setLoading(false);
    }
  };

  // 前の回答を表示（削除されていない回答のみ）
  const showPreviousAnswer = () => {
    if (!currentAnswerGroup || validAnswers.length <= 1) return;

    const currentIdx = currentAnswerGroup.currentIndex;
    console.log("showPreviousAnswer: currentIdx =", currentIdx, "validAnswers.length =", validAnswers.length, "answers.length =", currentAnswerGroup.answers.length);

    // 現在のインデックスより前に削除されていない回答があるか確認
    let found = false;
    for (let i = currentIdx - 1; i >= 0; i--) {
      if (!currentAnswerGroup.answers[i].deleted) {
        console.log("showPreviousAnswer: found deleted=false at index", i);
        setChatAnswerHistory((prev) => {
          const history = [...(prev[selectedChat!] ?? [])];
          const groupIndex = currentGroupIdx;
          if (groupIndex >= 0 && groupIndex < history.length) {
            history[groupIndex] = { ...history[groupIndex], currentIndex: i };
          }
          return { ...prev, [selectedChat!]: history };
        });
        found = true;
        return;
      }
    }
    if (!found) {
      console.log("showPreviousAnswer: no previous answer found");
    }
  };

  // 次の回答を表示（削除されていない回答のみ）
  const showNextAnswer = () => {
    if (!currentAnswerGroup || validAnswers.length <= 1) return;

    const currentIdx = currentAnswerGroup.currentIndex;
    console.log("showNextAnswer: currentIdx =", currentIdx, "validAnswers.length =", validAnswers.length, "answers.length =", currentAnswerGroup.answers.length);

    // 現在のインデックスより後に削除されていない回答があるか確認
    let found = false;
    for (let i = currentIdx + 1; i < currentAnswerGroup.answers.length; i++) {
      if (!currentAnswerGroup.answers[i].deleted) {
        console.log("showNextAnswer: found deleted=false at index", i);
        setChatAnswerHistory((prev) => {
          const history = [...(prev[selectedChat!] ?? [])];
          const groupIndex = currentGroupIdx;
          if (groupIndex >= 0 && groupIndex < history.length) {
            history[groupIndex] = { ...history[groupIndex], currentIndex: i };
          }
          return { ...prev, [selectedChat!]: history };
        });
        found = true;
        return;
      }
    }
    if (!found) {
      console.log("showNextAnswer: no next answer found");
    }
  };

  const createChat = async (title: string) => {
    // POST /api/chats の呼び出し例
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const fullUrl = `${API_URL}/chats`;

      const res = await apifetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      const text = await res.text();
      console.log("Response status:", res.status);
      console.log("Response body:", text);

      if (!res.ok) {
        throw new Error(`API Error ${res.status}: ${text}`);
      }

      const data = JSON.parse(text);
      // 作成したチャットを一覧に追加して選択
      const newChat: ChatSummary = { id: data.chat?.id ?? String(Date.now()), title: data.chat?.title ?? title };
      setChats((s) => [newChat, ...s]);
      setSelectedChat(newChat.id);
      setShowCreate(false);
    } catch (err) {
      console.error("チャット作成エラー:", err);
      showAlert("チャット作成に失敗しました: " + String(err));
    }
  };

  // チャット削除処理
  const handleDeleteChat = async (chatId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_URL) {
        alert("APIのURLが設定されていません");
        return;
      }

      const response = await apifetch(`${API_URL}/chats/${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("チャット削除エラー:", response.status);
        showAlert("チャット削除に失敗しました");
        return;
      }

      // チャットリストから削除
      const updatedChats = chats.filter((chat) => chat.id !== chatId);
      setChats(updatedChats);

      // 削除されたチャットの関連データをメモリから削除
      setChatMessages((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
      setChatPrompts((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
      setChatAnswerHistory((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
      setCurrentGroupIndex((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });

      // 削除したチャットが選択されていた場合は選択を解除
      if (selectedChat === chatId) {
        setSelectedChat(null);

        // 残っているチャットがある場合は最初のチャットを自動選択
        if (updatedChats.length > 0) {
          setSelectedChat(updatedChats[0].id);
          setShowCreate(false);
        } else {
          // チャットがない場合のみモーダルを表示
          setShowCreate(true);
        }
      }

      // ダイアログを閉じる
      setDeleteConfirmChatId(null);
      setChatWithTaggedExcuses(false);
      setOpenMenuChatId(null);

      // 成功メッセージを表示
      if (chatWithTaggedExcuses) {
        showAlert("チャットとランキングに登録された言い訳を削除しました");
      } else {
        showAlert("チャットを削除しました");
      }
    } catch (error) {
      console.error("チャット削除エラー:", error);
      showAlert("チャット削除に失敗しました");
    }
  };

  // チャットのタイトル編集処理
  const handleUpdateChatTitle = async () => {
    if (!editTitleChatId || !editTitleValue.trim()) {
      showAlert("タイトルを入力してください");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_URL) {
        showAlert("APIのURLが設定されていません");
        return;
      }

      const response = await apifetch(`${API_URL}/chats/${editTitleChatId}/title`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editTitleValue.trim() }),
      });

      if (!response.ok) {
        console.error("タイトル更新エラー:", response.status);
        showAlert("タイトル更新に失敗しました");
        return;
      }

      // チャットリストのタイトルを更新
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === editTitleChatId ? { ...chat, title: editTitleValue.trim() } : chat
        )
      );

      // モーダルを閉じる
      setEditTitleChatId(null);
      setEditTitleValue("");
      setOpenMenuChatId(null);
      showAlert("タイトルを更新しました");
    } catch (error) {
      console.error("タイトル更新エラー:", error);
      showAlert("タイトル更新に失敗しました");
    }
  };

  // タグをクリックしてランキング画面へ遷移
  const handleTagClick = (tagId?: string) => {
    if (tagId) {
      router.push(`/tag-ranking/${tagId}`);
    }
  };

  return (
    <div className={styles.mainContainer}>
      {/* ハンバーガーメニュー（モバイル用） */}
      <button
        className={styles.hamburgerButton}
        onClick={() => setShowSidebar(!showSidebar)}
      >
        ☰
      </button>

      {/* 右サイドバーハンバーガーボタン */}
      <button
        className={styles.hamburgerRightButton}
        onClick={() => setShowRightSidebar(!showRightSidebar)}
      >
        ⋮
      </button>

      {/* モバイル用オーバーレイ */}
      {showSidebar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
            display: 'none',
          }}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 左サイドバー */}
      <aside className={`${styles.sidebar} ${showSidebar ? styles.open : ''}`}>
        <button
          onClick={() => setShowCreate(true)}
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
          チャット新規作成
        </button>
        <div style={{ marginTop: 16, flex: 1, overflowY: "auto" }}>
          {chats.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: 10,
                marginTop: 8,
                background: c.id === selectedChat ? "#c3af96" : "#fff",
                borderRadius: 8,
                border: "1px solid #dfc9ab",
                color: c.id === selectedChat ? "#fff" : "#665440",
                fontWeight: c.id === selectedChat ? "600" : "500",
                transition: "all 0.25s ease",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (c.id !== selectedChat) {
                  e.currentTarget.style.background = "#f0ebe3";
                }
              }}
              onMouseLeave={(e) => {
                if (c.id !== selectedChat) {
                  e.currentTarget.style.background = "#fff";
                }
              }}
            >
              {/* チャットタイトル */}
              <div
                onClick={() => setSelectedChat(c.id)}
                style={{
                  flex: 1,
                  cursor: "pointer",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.title}
              </div>

              {/* 三点リーダーボタン */}
              <div style={{ position: "relative" }}>
                <button
                  className="no-hover-effect"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuChatId(openMenuChatId === c.id ? null : c.id);
                  }}
                  style={{
                    padding: "4px 8px",
                    fontSize: "18px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: c.id === selectedChat ? "#fff" : "#665440",
                    transition: "all 0.2s ease",
                  }}
                >
                  ⋯
                </button>

                {/* メニュー */}
                {openMenuChatId === c.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      background: "#fff",
                      border: "1px solid #dfc9ab",
                      borderRadius: "6px",
                      padding: "8px 0",
                      minWidth: "120px",
                      zIndex: 10,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    <button
                      className="no-hover-effect"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTitleChatId(c.id);
                        setEditTitleValue(c.title);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 16px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#665440",
                        fontSize: "0.9rem",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                    >
                      編集
                    </button>
                    <button
                      className="no-hover-effect"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 削除対象チャットのタグ付き言い訳をチェック
                        const chatAnswers = chatAnswerHistory[c.id] ?? [];
                        const hasTaggedExcuses = chatAnswers.some(group =>
                          group.answers.some(answer => {
                            // タグが付いており、削除されていない言い訳をチェック
                            return !answer.deleted && answer.tags && answer.tags.length > 0;
                          })
                        );
                        setChatWithTaggedExcuses(hasTaggedExcuses);
                        setDeleteConfirmChatId(c.id);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 16px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#c87960",
                        fontSize: "0.9rem",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          {/* ここを単純な localStorage 削除＋reload から Firebase signOut を行うコンポーネントに置換 */}
          <LogoutButton />
        </div>
      </aside>

      {/* 中央チャットビュー */}
      <main style={{
        flex: 1,
        background: "#f5f1eb",
        padding: 20,
        borderRadius: 12,
        border: "2px solid #c3af96",
        minWidth: 0,
      }} className={styles.chatArea}>
        <div style={{ maxWidth: 900, margin: "0 auto" , paddingTop: 20}}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "12px" }}>
              <img
                src="/猫アイコン1.png"
                alt="猫アイコン"
                style={{ width: 40, height: 40, paddingTop: 3 }}
              />
              <h2 style={{
                  fontSize: "1.3rem",
                fontWeight: "500",
                color: "#665440",
                margin: 0,
              }}>
                生成された言い訳
              </h2>
            </div>

            <div style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              margin: "16px 0",
            }}>
              {/* 前の回答ボタン */}
              <button
                onClick={showPreviousAnswer}
                disabled={!currentAnswerGroup || currentAnswerGroup.answers.length <= 1}
                style={{
                  flex: "0 0 auto",
                  padding: "12px 16px",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: !currentAnswerGroup || currentAnswerGroup.answers.length <= 1 ? "#ccc" : "#fff",
                  background: !currentAnswerGroup || currentAnswerGroup.answers.length <= 1 ? "#ddd" : "#665440",
                  border: "none",
                  borderRadius: "10px",
                  cursor: !currentAnswerGroup || currentAnswerGroup.answers.length <= 1 ? "not-allowed" : "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (currentAnswerGroup && currentAnswerGroup.answers.length > 1) {
                    e.currentTarget.style.background = "#9a6044";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentAnswerGroup && currentAnswerGroup.answers.length > 1) {
                    e.currentTarget.style.background = "#665440";
                  }
                }}
              >
                ◀
              </button>

              {/* AIの回答 */}
              <div key="current-answer" style={{
                flex: 1,
                padding: 20,
                background: currentAnswer?.success ? "var(--success-bg-light)" : "#fff",
                borderRadius: 12,
                fontSize: 25,
                color: currentAnswer?.deleted && showHiddenAnswers[selectedChat!] ? "#999" : "#665440",
                border: currentAnswer?.success ? "2px solid var(--success-color-light)" : (currentAnswer?.deleted && showHiddenAnswers[selectedChat!] ? "1px solid #ccc" : "1px solid #dfc9ab"),
                lineHeight: 1.8,
                opacity: currentAnswer?.deleted && showHiddenAnswers[selectedChat!] ? 0.5 : 1,
                position: "relative",
                minHeight: 140,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                wordWrap: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}>
                {currentAnswer?.deleted && showHiddenAnswers[selectedChat!] && (
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#999",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                  }}>
                    非表示
                  </div>
                )}
                <div style={{
                  opacity: currentAnswer?.deleted && showHiddenAnswers[selectedChat!] ? 0.3 : 1,
                  flex: 1,
                }}>
                  {currentAnswer?.text || (messages.filter(m => m.role === "ai").slice(-1)[0]?.text || "AIの回答を待っています...")}
                </div>
              </div>

              {/* 次の回答ボタン */}
              <button
                onClick={showNextAnswer}
                disabled={!currentAnswerGroup || currentAnswerGroup.answers.length <= 1}
                style={{
                  flex: "0 0 auto",
                  padding: "12px 16px",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: !currentAnswerGroup || currentAnswerGroup.answers.length <= 1 ? "#ccc" : "#fff",
                  background: !currentAnswerGroup || currentAnswerGroup.answers.length <= 1 ? "#ddd" : "#665440",
                  border: "none",
                  borderRadius: "10px",
                  cursor: !currentAnswerGroup || currentAnswerGroup.answers.length <= 1 ? "not-allowed" : "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (currentAnswerGroup && currentAnswerGroup.answers.length > 1) {
                    e.currentTarget.style.background = "#9a6044";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentAnswerGroup && currentAnswerGroup.answers.length > 1) {
                    e.currentTarget.style.background = "#665440";
                  }
                }}
              >
                ▶
              </button>
            </div>
          </div>
            {/*回答のページ数表示*/}
            {currentAnswerGroup && validAnswers.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: 18, color: "#9a6044", fontWeight: "600"}}>
                  {currentAnswer ? (() => {
                      // 現在表示されている回答が、削除されていない回答の何番目かを計算
                      const currentAnswerIndex = currentAnswerGroup.answers.findIndex(a => a === currentAnswer);
                      if (currentAnswerIndex >= 0) {
                          // currentAnswerIndexまでのすべての回答のうち、削除されていないものの数
                          const position = currentAnswerGroup.answers
                              .slice(0, currentAnswerIndex + 1)
                              .filter(a => !a.deleted).length;
                          return `${position}/${validAnswers.length}`;
                      }
                      return `1/${validAnswers.length}`;
                  })() : `1/${validAnswers.length}`}
                </span>
                </div>
            )}

          <div style={{ display: "flex", gap: 12, margin: "16px 0", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={markSuccess}
              disabled={currentAnswer?.success}
              style={{
                padding: "10px 20px",
                fontSize: "0.95rem",
                fontWeight: "600",
                color: currentAnswer?.success ? "#ccc" : "#fff",
                background: currentAnswer?.success ? "#ddd" : "var(--success-color-light)",
                border: "none",
                borderRadius: "10px",
                cursor: currentAnswer?.success ? "not-allowed" : "pointer",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (!currentAnswer?.success) {
                  e.currentTarget.style.background = "var(--success-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!currentAnswer?.success) {
                  e.currentTarget.style.background = "var(--success-color-light)";
                }
              }}
            >
              成功
            </button>
            <button
              onClick={hideAnswer}
              disabled={!currentAnswer || currentAnswer.deleted || currentAnswer.success}
              style={{
                padding: "10px 20px",
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "#fff",
                background: !currentAnswer || currentAnswer.deleted || currentAnswer.success ? "#ccc" : "#c87960",
                border: "none",
                borderRadius: "10px",
                cursor: !currentAnswer || currentAnswer.deleted || currentAnswer.success ? "not-allowed" : "pointer",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (currentAnswer && !currentAnswer.deleted && !currentAnswer.success) {
                  e.currentTarget.style.background = "#a85d48";
                }
              }}
              onMouseLeave={(e) => {
                if (currentAnswer && !currentAnswer.deleted && !currentAnswer.success) {
                  e.currentTarget.style.background = "#c87960";
                }
              }}
            >
              非表示
            </button>
            {currentAnswer?.deleted && (
              <button
                onClick={undoHideAnswer}
                style={{
                  padding: "10px 20px",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: "#fff",
                  background: "#ff9800",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e68900";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ff9800";
                }}
              >
                非表示を解除
              </button>
            )}
            <button
              onClick={getAnotherAnswer}
              disabled={loading || !currentAnswerGroup}
              style={{
                padding: "10px 20px",
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
                if (!loading && currentAnswerGroup) {
                  e.currentTarget.style.background = "#9a6044";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && currentAnswerGroup) {
                  e.currentTarget.style.background = "#665440";
                }
              }}
            >
              {loading ? "生成中..." : "他の回答をもらう"}
            </button>
          </div>

          <div style={{ marginTop: 28 }}>

            <label style={{
              display: "block",
              marginBottom: 12,
                paddingTop: 20,
              fontSize: "1.3rem",
              fontWeight: "500",
              color: "#665440",
            }}>
                <img
                    src="/状況.png"
                    alt="状況アイコン"
                    style={{ width: 32, height: 32, verticalAlign: "middle", marginRight: 8 }}
                />
              今の状況をAIに相談してみましょう
            </label>
            <textarea
              value={prompt}
              onChange={(e) => {
                // チャットが選択されていない場合は、一時的なプロンプトを保持
                if (selectedChat) {
                  setChatPrompts((prev) => ({
                    ...prev,
                    [selectedChat]: e.target.value,
                  }));
                } else {
                  // 初回時はダミーチャットIDで保存
                  const tempChatId = "temp-chat";
                  setChatPrompts((prev) => ({
                    ...prev,
                    [tempChatId]: e.target.value,
                  }));
                }
              }}
              style={{
                width: "100%",
                minHeight: 140,
                borderRadius: 10,
                padding: 14,
                fontSize: 20,
                border: "2px solid #c3af96",
                fontFamily: "var(--font-noto-sans-jp)",
                color: "#665440",
                background: "#fff",
                resize: "vertical",
                transition: "all 0.25s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#9a6044";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(154, 96, 68, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#c3af96";
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="要望や状況を入力して AI に相談"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                onClick={sendPrompt}
                disabled={loading}
                style={{
                  padding: "12px 32px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#fff",
                  background: "#665440",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#9a6044";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#665440";
                  }
                }}
              >
                {loading ? "送信中..." : "送信"}
              </button>
            </div>

            {/* 成功の履歴ボタン */}
            <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => setShowSuccessHistory(!showSuccessHistory)}
                style={{
                  flex: "0 0 auto",
                  padding: "12px 20px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#fff",
                  background: answerHistory.filter(g => g.answers.some(a => a.success && !a.deleted)).length > 0 ? "var(--success-color-light)" : "#ccc",
                  border: "none",
                  borderRadius: "10px",
                  cursor: answerHistory.filter(g => g.answers.some(a => a.success && !a.deleted)).length > 0 ? "pointer" : "not-allowed",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (answerHistory.filter(g => g.answers.some(a => a.success && !a.deleted)).length > 0) {
                    e.currentTarget.style.background = "var(--success-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (answerHistory.filter(g => g.answers.some(a => a.success && !a.deleted)).length > 0) {
                    e.currentTarget.style.background = "var(--success-color-light)";
                  }
                }}
                disabled={answerHistory.filter(g => g.answers.some(a => a.success && !a.deleted)).length === 0}
              >
                成功一覧
              </button>

              {/* 非表示を見るボタン */}
              <button
                onClick={toggleShowHiddenAnswers}
                disabled={!currentAnswerGroup || !currentAnswerGroup.answers.some(a => a.deleted)}
                style={{
                  flex: "0 0 auto",
                  padding: "12px 20px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#fff",
                  background: !currentAnswerGroup || !currentAnswerGroup.answers.some(a => a.deleted) ? "#ccc" : "#c87960",
                  border: "none",
                  borderRadius: "10px",
                  cursor: !currentAnswerGroup || !currentAnswerGroup.answers.some(a => a.deleted) ? "not-allowed" : "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (currentAnswerGroup && currentAnswerGroup.answers.some(a => a.deleted)) {
                    e.currentTarget.style.background = "#a85d48";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentAnswerGroup && currentAnswerGroup.answers.some(a => a.deleted)) {
                    e.currentTarget.style.background = "#c87960";
                  }
                }}
              >
                {showHiddenAnswers[selectedChat!] ? "非表示一覧" : "非表示一覧"}
              </button>
            </div>

            {/* 成功の履歴一覧（横並び表示） */}
            {showSuccessHistory && answerHistory.length > 0 && answerHistory.some(g => g.answers.some(a => a.success && !a.deleted)) && (
              <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
                <div style={{
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  paddingBottom: 12,
                  maxWidth: "100%",
                }}>
                  {answerHistory.map((group, idx) => {
                    const successAnswers = group.answers.filter(a => a.success && !a.deleted);
                    return successAnswers.length > 0 ? successAnswers.map((successAnswer, ansIdx) => (
                      <div
                        key={`${idx}-${ansIdx}`}
                        onClick={() => setCurrentGroupIndex((prev) => ({ ...prev, [selectedChat!]: idx }))}
                        style={{
                          minWidth: 280,
                          maxWidth: "100%",
                          height: "auto",
                          minHeight: 160,
                          padding: 18,
                          background: idx === currentGroupIdx ? "var(--success-color-light)" : "#fff",
                          borderRadius: 10,
                          cursor: "pointer",
                          border: "2px solid var(--success-border)",
                          transition: "all 0.25s ease",
                          color: idx === currentGroupIdx ? "#fff" : "var(--success-color-light)",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          boxSizing: "border-box",
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                        }}
                        onMouseEnter={(e) => {
                          if (idx !== currentGroupIdx) {
                            e.currentTarget.style.background = "#e8f5e9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (idx !== currentGroupIdx) {
                            e.currentTarget.style.background = "#fff";
                          }
                        }}
                      >
                        {/* 右上のキャンセルボタン */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const answerIndexInGroup = group.answers.findIndex((a) => a === successAnswer);
                            cancelSuccess(idx, answerIndexInGroup);
                          }}
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 24,
                            height: 24,
                            padding: 0,
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: idx === currentGroupIdx ? "#fff" : "var(--success-color-light)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          ✕
                        </button>
                        <div style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: idx === currentGroupIdx ? "rgba(255,255,255,0.95)" : "var(--success-color-light)",
                          paddingRight: 40,
                          fontWeight: "700",
                          marginBottom: 8,
                        }}>
                          {successAnswer.text.substring(0, 80)}
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: idx === currentGroupIdx ? "rgba(255,255,255,0.8)" : "rgba(76, 175, 80, 0.7)",
                          fontWeight: "500",
                        }}>
                          {group.prompt.substring(0, 40)}
                        </div>

                        {/* ノートアイコンボタン（右下） */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLastExcuseText(successAnswer.text);
                            setShowSaveModal(true);
                          }}
                          style={{
                            position: "absolute",
                            bottom: 12,
                            right: 12,
                            width: 32,
                            height: 32,
                            padding: 0,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            opacity: 0.7,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "1";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "0.7";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <img
                            src="/ノートアイコン.png"
                            alt="保存"
                            style={{ width: 38, height: 38 }}
                          />
                        </button>
                      </div>
                    )) : null;
                  })}
                </div>
              </div>
            )}

            {/* 非表示の履歴一覧（横並び表示） */}
            {showHiddenAnswers[selectedChat!] && answerHistory.length > 0 && (
              <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
                <div style={{
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  paddingBottom: 12,
                  maxWidth: "100%",
                }}>
                  {answerHistory.map((group, idx) => {
                    const hiddenAnswers = group.answers.filter(a => a.deleted);
                    return hiddenAnswers.length > 0 ? hiddenAnswers.map((hiddenAnswer, ansIdx) => (
                      <div
                        key={`${idx}-${ansIdx}`}
                        onClick={() => setCurrentGroupIndex((prev) => ({ ...prev, [selectedChat!]: idx }))}
                        style={{
                          minWidth: 280,
                          maxWidth: "100%",
                          height: "auto",
                          minHeight: 160,
                          padding: 18,
                          background: idx === currentGroupIdx ? "#d4957a" : "#fff",
                          borderRadius: 10,
                          cursor: "pointer",
                          border: "2px solid #c87960",
                          transition: "all 0.25s ease",
                          color: idx === currentGroupIdx ? "#fff" : "#d4957a",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          boxSizing: "border-box",
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                        }}
                        onMouseEnter={(e) => {
                          if (idx !== currentGroupIdx) {
                            e.currentTarget.style.background = "#ffe8e0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (idx !== currentGroupIdx) {
                            e.currentTarget.style.background = "#fff";
                          }
                        }}
                      >
                        {/* 右上のキャンセルボタン */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const answerIndexInGroup = group.answers.findIndex((a) => a === hiddenAnswer);
                            cancelHide(idx, answerIndexInGroup);
                          }}
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 24,
                            height: 24,
                            padding: 0,
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: idx === currentGroupIdx ? "#fff" : "#d4957a",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          ✕
                        </button>
                        <div style={{
                          fontSize: 20,
                          color: idx === currentGroupIdx ? "rgba(255,255,255,0.9)" : "#d4957a",
                          marginBottom: 4,
                          fontWeight: "600",
                        }}>
                          <strong></strong> {group.prompt.substring(0, 35)}
                        </div>
                        <div style={{
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: idx === currentGroupIdx ? "rgba(255,255,255,0.95)" : "#d4957a",
                        }}>
                          <strong></strong> {hiddenAnswer.text.substring(0, 80)}
                        </div>
                      </div>
                    )) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 右サイドバー (タグ等) */}
      <aside className={`${styles.rightSidebar} ${showRightSidebar ? styles.open : ''}`} style={{
        width: 280,
        background: "#fff6e9",
        padding: 16,
        borderRadius: 12,
        border: "2px solid #c3af96",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        gap: 16,
      }}>
        {/* タグ一覧 */}
        {(() => {
          return tags.length > 0 ? (
            <div>
              <h4 style={{
                fontSize: "0.9rem",
                fontWeight: "700",
                color: "#665440",
                marginBottom: "8px",
              }}>
                タグ一覧
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {tags.map((t) => (
                  <div
                    key={t.id || t.title}
                    style={{
                      background: "#fff",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #dfc9ab",
                      color: "#665440",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#c3af96";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.color = "#665440";
                    }}
                    onClick={() => handleTagClick(t.id)}
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}
      </aside>

      {/* Create モーダル */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={createChat}
          isFirstChat={chats.length === 0}
          onAlert={showAlert}
        />
      )}

      {/* Save Excuse モーダル */}
      <SaveExcuseModal
        isOpen={showSaveModal}
        excuseText={lastExcuseText}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveExcuse}
        availableTags={tags}
        onTagsUpdated={fetchTags}
      />

      {/* チャット削除確認ダイアログ */}
      {deleteConfirmChatId && (
        <div style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.4)",
          zIndex: 1001,
        }}>
          <div style={{
            background: "#fff6e9",
            padding: "2rem",
            borderRadius: "16px",
            maxWidth: "400px",
            border: "2px solid #c3af96",
            boxShadow: "0 8px 24px rgba(102, 84, 64, 0.2)",
          }}>
            <h3 style={{
              fontSize: "1.3rem",
              fontWeight: "700",
              color: "#665440",
              marginBottom: "1rem",
              textAlign: "center",
            }}>
              本当にチャットを削除しますか？
            </h3>
            {chatWithTaggedExcuses && (
              <p style={{
                fontSize: "0.9rem",
                color: "#c87960",
                marginBottom: "1rem",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#ffe8e0",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #c87960",
              }}>
                ⚠️ ランキングに登録されている言い訳があります。本当に削除しますか？
              </p>
            )}
            <p style={{
              fontSize: "0.95rem",
              color: "#9a6044",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}>
              このアクションは取り消せません。
            </p>
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
            }}>
              <button
                onClick={() => {
                  handleDeleteChat(deleteConfirmChatId);
                }}
                style={{
                  padding: "10px 24px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#fff",
                  background: "#c87960",
                  border: "2px solid #c87960",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                はい
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmChatId(null);
                  setChatWithTaggedExcuses(false);
                }}
                style={{
                  padding: "10px 24px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#665440",
                  background: "#fff",
                  border: "2px solid #c3af96",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* チャットのタイトル編集モーダル */}
      {editTitleChatId && (
        <div style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.4)",
          zIndex: 1001,
        }}>
          <div style={{
            background: "#fff6e9",
            padding: "2rem",
            borderRadius: "16px",
            maxWidth: "500px",
            border: "2px solid #c3af96",
            boxShadow: "0 8px 24px rgba(102, 84, 64, 0.2)",
          }}>
            <h3 style={{
              fontSize: "1.3rem",
              fontWeight: "700",
              color: "#665440",
              marginBottom: "1rem",
              textAlign: "center",
            }}>
              チャットタイトルを編集
            </h3>
            <input
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdateChatTitle();
                }
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "1rem",
                border: "2px solid #c3af96",
                borderRadius: "10px",
                fontFamily: "var(--font-noto-sans-jp)",
                color: "#665440",
                background: "#fff",
                marginBottom: "1.5rem",
                transition: "all 0.25s ease",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#9a6044";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(154, 96, 68, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#c3af96";
                e.currentTarget.style.boxShadow = "none";
              }}
              autoFocus
            />
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => {
                  setEditTitleChatId(null);
                  setEditTitleValue("");
                }}
                style={{
                  padding: "10px 24px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#665440",
                  background: "#fff",
                  border: "2px solid #c3af96",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f0ebe3";
                  e.currentTarget.style.borderColor = "#9a6044";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#c3af96";
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateChatTitle}
                style={{
                  padding: "10px 24px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#fff",
                  background: "#665440",
                  border: "2px solid #665440",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#9a6044";
                  e.currentTarget.style.borderColor = "#9a6044";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#665440";
                  e.currentTarget.style.borderColor = "#665440";
                }}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ポップアップ通知 */}
      {showPopup && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
          zIndex: 2001,
          maxWidth: "400px",
          minWidth: "300px",
          border: "2px solid #c3af96",
        }}>
          <p style={{
            margin: "0 0 20px 0",
            fontSize: "16px",
            color: "#665440",
            fontWeight: "500",
            lineHeight: 1.5,
          }}>
            {popupMessage}
          </p>
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
          }}>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                padding: "10px 20px",
                background: "#665440",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#9a6044";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#665440";
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ポップアップ背景オーバーレイ */}
      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.3)",
            zIndex: 2000,
          }}
        />
      )}
    </div>
  );
}

/* Create モーダル（簡易） */
function CreateModal({ onClose, onCreate, isFirstChat, onAlert }: { onClose: () => void; onCreate: (title: string) => void; isFirstChat: boolean; onAlert: (message: string) => void }) {
  const [title, setTitle] = useState("");

  const submit = () => {
    if (!title.trim()) {
      onAlert("タイトルを入力してください");
      return;
    }
    onCreate(title);
  };

  const handleCancel = () => {
    // スキップ時：単にモーダルを閉じるだけ
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.4)",
      zIndex: 1000,
      padding: "2rem",
    }}>
      <div style={{
        background: "#fff6e9",
        padding: "3rem",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "600px",
        border: "2px solid #c3af96",
        boxShadow: "0 8px 24px rgba(102, 84, 64, 0.2)",
      }}>
        <h2 style={{
          fontSize: "1.8rem",
          fontWeight: "700",
          color: "#665440",
          marginBottom: "0.5rem",
          textAlign: "center",
        }}>
          新しいチャットを作成しましょう！
        </h2>
        <p style={{
          fontSize: "1rem",
          color: "#9a6044",
          textAlign: "center",
          marginBottom: "2rem",
        }}>
          {isFirstChat ? "タイトルを入力してください" : "タイトルを入力してください。"}
        </p>
        <div style={{ marginBottom: "2rem" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "1rem",
              border: "2px solid #c3af96",
              borderRadius: "10px",
              fontFamily: "var(--font-noto-sans-jp)",
              color: "#665440",
              background: "#fff",
              transition: "all 0.25s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#9a6044";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(154, 96, 68, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#c3af96";
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder="例: 課題が終わらない"
            autoFocus
          />
        </div>
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: "12px 28px",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#665440",
              background: "#fff",
              border: "2px solid #c3af96",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f0ebe3";
              e.currentTarget.style.borderColor = "#9a6044";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#c3af96";
            }}
          >
            {isFirstChat ? "キャンセル" : "キャンセル"}
          </button>
          <button
            onClick={submit}
            style={{
              padding: "12px 32px",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#fff",
              background: "#665440",
              border: "2px solid #665440",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#9a6044";
              e.currentTarget.style.borderColor = "#9a6044";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#665440";
              e.currentTarget.style.borderColor = "#665440";
            }}
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
}