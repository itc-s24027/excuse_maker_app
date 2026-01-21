// 解説: リクエストを受け取ってサービスに繋ぐ「窓口」だ。
import type { Request, Response } from "express";
import { createChatSchema, evaluationSchema } from "../validators/chatSchemas.js";
import * as chatService from "../services/chatService.js";

// チャット作成
export async function createChat(req: Request, res: Response) {
    try {
        const input = createChatSchema.parse(req.body);
        const result = await chatService.createChat({
            userId: req.user.uid,
            ...input,
        });
        res.status(201).json(result);
    } catch (err: any) {
        res.status(400).json({ error: "入力が正しくありません"});
    }
}

// ユーザーのチャット一覧取得
export async function getUserChats(req: Request, res: Response) {
    try {
        const rows = await chatService.getChatsByUser(req.user.uid);
        res.status(200).json(rows);
    } catch (err: any) {
        res.status(500).json({ error: "一覧取得に失敗しました" });
    }
}

// チャット詳細取得
export async function getChatById(req: Request, res: Response) {
    try {
        const chatId = req.params.chatId!;
        const row = await chatService.getChatDetail(chatId);
        res.status(200).json(row);
    } catch {
        res.status(404).json({ error: "見つかりません" });
    }
}

// 評価更新
export async function updateEvaluation(req: Request, res: Response) {
    try {
        const input = evaluationSchema.parse(req.body);
        const chatId = req.params.chatId!;
        const updated = await chatService.updateEvaluation({
            chatId,
            userId: req.user.uid,
            ...input,
        });
        res.status(200).json(updated);
    } catch (err: any) {
        res.status(400).json({ error: "評価の更新に失敗しました" });
    }
}

// チャット削除
export async function deleteChat(req: Request, res: Response) {
    try {
        const chatId = req.params.chatId!;
        await chatService.deleteChat({
            chatId,
            userId: req.user.uid,
        });
        res.status(204).end();
    } catch (err: any) {
        res.status(403).json({ error: "削除できませんでした" });
    }
}