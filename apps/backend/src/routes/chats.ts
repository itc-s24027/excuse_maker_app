// 解説: URLと処理を紐付ける地図だ。
import { Router } from "express";
import auth from "../middlewares/auth.js";
import * as chatsController from "../controllers/chatsController.js";

const router = Router();

// チャット作成
router.post("/", auth, chatsController.createChat);

// ユーザーのチャット一覧取得
router.get("/user", auth, chatsController.getUserChats);

// チャット詳細取得
router.get("/:chatId", auth, chatsController.getChatById);

// 評価更新
router.put("/:chatId/evaluation", auth, chatsController.updateEvaluation);

// チャット削除
router.delete("/:chatId", auth, chatsController.deleteChat);

export default router;