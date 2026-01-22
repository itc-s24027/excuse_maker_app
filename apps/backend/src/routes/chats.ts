// 解説: URLと処理を紐付ける地図だ。
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth/index.js";
import * as chatsController from "../controllers/chatsController.js";

const router = Router();

// チャット作成
router.post("/", authMiddleware, chatsController.createChat);

// ユーザーのチャット一覧取得
router.get("/user", authMiddleware, chatsController.getUserChats);

// チャット詳細取得
router.get("/:chatId", authMiddleware, chatsController.getChatById);

// 評価更新
router.put("/:chatId/evaluation", authMiddleware, chatsController.updateEvaluation);

// チャット削除
router.delete("/:chatId", authMiddleware, chatsController.deleteChat);

export default router;