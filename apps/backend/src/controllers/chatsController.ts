// ルートから呼ばれる薄い層（入力整形・レスポンス）

import { Request, Response } from "express";
import { createChatSchema, evaluationSchema } from "../validators/chatSchemas.js";
import * as chatService from "../services/chatService.js";
import { z } from "zod";

// POST /api/chats - チャット作成
export async function createChat(req: Request, res: Response) {
    try {
        const input = createChatSchema.parse(req.body); // 入力バリデーション
        const user = (req as any).user; // 認証ミドルウェアでセットされた user 情報を取得
        const result = await chatService.createChat({ userId: user.uid, ...input }); // サービス層に委譲
        res.status(201).json(result); // 作成成功レスポンス
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            // Zodのエラー（入力ミス）の場合
            return res.status(400).json({
                error: "入力内容が正しくありません",
                details: err.errors // 具体的にどの項目がダメだったか返す
            });
        }
        // それ以外のエラー（サーバー故障とか）の場合
        res.status(500).json({ error: "サーバーで問題が発生したよ" });
    }
}

// GET /api/chats/user - ユーザーのチャット一覧取得
export async function getUserChats(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const rows = await chatService.getChatsByUser(user.uid);
        res.status(200).json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// GET /api/chats/:chatId - チャット詳細取得
export async function getChatById(req: Request, res: Response) {
    try {
        const { chatId } = req.params;
        const row = await chatService.getChatDetail(chatId);
        if (!row) return res.status(404).json({ error: "not found" });
        res.status(200).json(row);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// PUT /api/chats/:chatId/evaluation - チャット評価更新
export async function updateEvaluation(req: Request, res: Response) {
    try {
        const input = evaluationSchema.parse(req.body);
        const user = (req as any).user;
        const { chatId } = req.params;
        const updated = await chatService.updateEvaluation({ chatId, userId: user.uid, ...input });
        res.status(200).json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message ?? "invalid request" });
    }
}

// DELETE /api/chats/:chatId - チャット削除
export async function deleteChat(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const { chatId } = req.params;
        await chatService.deleteChat({ chatId, userId: user.uid });
        res.status(204).end();
    } catch (err: any) {
        res.status(403).json({ error: err.message });
    }
}
