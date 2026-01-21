// /chats 系ルーター（要求されたエンドポイント群）
// （認証ミドルウェア適用）。各エンドポイントをコントローラに委譲。

// 実際には、logger, errorHandler, 詳細なエラーハンドリング、入力サニタイズ、権限チェックを追加する

import { Router } from "express";
import { verifyFirebaseToken } from "../middlewares/auth.js";
import * as chatsController from "../controllers/chatsController.js";

const router = Router();

// POST /api/chats
router.post("/chats", verifyFirebaseToken, chatsController.createChat);

// GET /api/chats/user
router.get("/chats/user", verifyFirebaseToken, chatsController.getUserChats);

// GET /api/chats/:chatId
router.get("/chats/:chatId", verifyFirebaseToken, chatsController.getChatById);

// PUT /api/chats/:chatId/evaluation(評価)
router.put("/chats/:chatId/evaluation", verifyFirebaseToken, chatsController.updateEvaluation);

// DELETE /api/chats/:chatId
router.delete("/chats/:chatId", verifyFirebaseToken, chatsController.deleteChat);

export default router;
