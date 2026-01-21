// 解説: URLと処理を紐付ける地図だ。
import { Router } from "express";
import { verifyFirebaseToken } from "../middlewares/auth.js";
import * as chatsController from "../controllers/chatsController.js";

const router = Router();

// チャット作成
router.post("/", verifyFirebaseToken, chatsController.createChat);

// ユーザーのチャット一覧取得
router.get("/user", verifyFirebaseToken, chatsController.getUserChats);

// チャット詳細取得
router.get("/:chatId", verifyFirebaseToken, chatsController.getChatById);

// 評価更新
router.put("/:chatId/evaluation", verifyFirebaseToken, chatsController.updateEvaluation);

// チャット削除
router.delete("/:chatId", verifyFirebaseToken, chatsController.deleteChat);

export default router;