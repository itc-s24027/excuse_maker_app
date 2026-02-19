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

// 非表示フラグ更新
router.put("/:chatId/visibility", authMiddleware, chatsController.updateExcuseVisibility);

// チャット削除
router.delete("/:chatId", authMiddleware, chatsController.deleteChat);

// 言い訳を保存（タグ付き）
router.post("/:chatId/excuses", authMiddleware, chatsController.saveExcuse);

// いいねを追加
router.post("/excuses/:excuseId/like", authMiddleware, chatsController.addLike);

// いいねを削除
router.delete("/excuses/:excuseId/like", authMiddleware, chatsController.removeLike);

// いいね情報を取得
router.get("/excuses/:excuseId/like", chatsController.getLikeInfo);

export default router;