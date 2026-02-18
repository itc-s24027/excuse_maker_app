import { Router } from "express";
import { authMiddleware } from "../middlewares/auth/index.js";
import * as tagsController from "../controllers/tagsController.js";

const router = Router();

// タグ一覧取得
router.get("/", tagsController.getAllTags);

// タグ新規作成
router.post("/", authMiddleware, tagsController.createTag);

// タグ削除
router.delete("/:id", authMiddleware, tagsController.deleteTag);

// 言い訳のタグ一覧取得
router.get("/excuse/:excuseId", tagsController.getExcuseTags);

// 言い訳にタグを追加
router.post("/excuse/:excuseId", authMiddleware, tagsController.addTagToExcuse);

// 言い訳からタグを削除
router.delete(
  "/excuse/:excuseId/:tagId",
  authMiddleware,
  tagsController.removeTagFromExcuse
);

export default router;

