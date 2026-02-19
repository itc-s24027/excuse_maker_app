// 解説: リクエストを受け取ってサービスに繋ぐ「窓口」
import type { Request, Response } from "express";
import { createChatSchema, evaluationSchema } from "../validators/chatSchemas.js";
import * as chatService from "../services/chatService.js";

// チャット作成
export async function createChat(req: Request, res: Response) {
    // 受信 body をログ（デバッグ用）
    // まずは受信 body を整形（tags が文字列で来る場合への耐性）
    const raw = req.body ?? {};
    const normalized = {
        title: raw.title ?? "",
        tags: Array.isArray(raw.tags)
            ? raw.tags
            : typeof raw.tags === "string"
                ? raw.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                : [],
    };
    console.log("createChat: normalized body=", JSON.stringify(normalized));

    // 1) 入力バリデーション
    let input;
    try {
        input = createChatSchema.parse(normalized);
    } catch (err: any) {
        return res.status(400).json({ error: "入力が正しくありません", details: err?.errors ?? null });
    }

    // 2) サービス呼び出し
    try {
        const result = await chatService.createChat({
            userUid: req.user?.uid ?? "",
            title: input.title,
        });
        return res.status(201).json(result);
    } catch (err: any) {
        console.error("createChat service error", err);
        return res.status(500).json({ error: "チャット作成に失敗しました", details: err?.message ?? String(err) });
    }
}

// ユーザーのチャット一覧取得
export async function getUserChats(req: Request, res: Response) {
    try {
        const rows = await chatService.getChatsByUser(req.user?.uid ?? "");
        res.status(200).json(rows);
    } catch (err: any) {
        res.status(500).json({ error: "一覧取得に失敗しました" });
    }
}

// チャット詳細取得
export async function getChatById(req: Request, res: Response) {
    try {
        const chatId = req.params.chatId!;
        const row = await chatService.getChatDetail(chatId, req.user?.uid ?? "");
        res.status(200).json(row);
    } catch {
        res.status(404).json({ error: "見つかりません" });
    }
}

// 評価更新
export async function updateEvaluation(req: Request, res: Response) {
    try {
        const input = evaluationSchema.parse(req.body);
        // input = { excuseId, success }

        const updated = await chatService.updateEvaluation(input);
        res.status(200).json(updated);
    } catch {
        res.status(400).json({ error: "評価の更新に失敗しました" });
    }
}

// チャット削除
export async function deleteChat(req: Request, res: Response) {
    try {
        const chatId = req.params.chatId!;
        await chatService.deleteChat({
            chatId,
            userUid: req.user?.uid ?? "",
        });
        res.status(204).end();
    } catch (err: any) {
        res.status(403).json({ error: "削除できませんでした" });
    }
}

// 言い訳を保存（タグ付き）
export async function saveExcuse(req: Request, res: Response) {
    try {
        const { excuseText, situation, tagIds } = req.body;
        const chatId = req.params.chatId;

        if (!excuseText || !chatId) {
            return res.status(400).json({ error: "言い訳とチャットIDが必須です" });
        }

        const result = await chatService.saveExcuse({
            chatId,
            excuseText,
            situation: situation ?? "",
            tagIds: Array.isArray(tagIds) ? tagIds : [],
        });

        return res.status(201).json(result);
    } catch (err: any) {
        console.error("saveExcuse error:", err);
        return res.status(500).json({ error: "言い訳の保存に失敗しました", details: err?.message ?? String(err) });
    }
}

// いいねを追加
export async function addLike(req: Request, res: Response) {
    try {
        const excuseId = req.params.excuseId;
        const userUid = req.user?.uid ?? "";

        if (!excuseId) {
            return res.status(400).json({ error: "言い訳IDが必須です" });
        }

        const like = await chatService.addLike({ excuseId, userUid });
        return res.status(201).json({ like, message: "いいねしました" });
    } catch (err: any) {
        console.error("addLike error:", err);
        return res.status(500).json({ error: err.message ?? "いいねに失敗しました" });
    }
}

// いいねを削除
export async function removeLike(req: Request, res: Response) {
    try {
        const excuseId = req.params.excuseId;
        const userUid = req.user?.uid ?? "";

        if (!excuseId) {
            return res.status(400).json({ error: "言い訳IDが必須です" });
        }

        await chatService.removeLike({ excuseId, userUid });
        return res.status(200).json({ message: "いいねを取り消しました" });
    } catch (err: any) {
        console.error("removeLike error:", err);
        return res.status(500).json({ error: err.message ?? "いいね取り消しに失敗しました" });
    }
}

// 言い訳のいいね情報を取得
export async function getLikeInfo(req: Request, res: Response) {
    try {
        const excuseId = req.params.excuseId;
        const userUid = req.user?.uid ?? undefined;

        if (!excuseId) {
            return res.status(400).json({ error: "言い訳IDが必須です" });
        }

        const likeInfo = await chatService.getLikeInfo({ excuseId, userUid });
        return res.status(200).json(likeInfo);
    } catch (err: any) {
        console.error("getLikeInfo error:", err);
        return res.status(500).json({ error: err.message ?? "いいね情報取得に失敗しました" });
    }
}
