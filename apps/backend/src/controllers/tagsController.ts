import type { Request, Response } from "express";
import {
  createTagSchema,
  tagIdSchema,
  excuseTagSchema,
} from "../validators/tagSchemas.js";
import * as tagService from "../services/tagService.js";

// 全タグ取得
export async function getAllTags(req: Request, res: Response) {
  try {
    const tags = await tagService.getAllTags();
    res.status(200).json({ tags });
  } catch (err: any) {
    console.error("getAllTags error", err);
    res.status(500).json({ error: "タグ一覧取得に失敗しました" });
  }
}

// タグ新規作成
export async function createTag(req: Request, res: Response) {
  try {
    const input = createTagSchema.parse(req.body);
    const userUid = req.user?.uid ?? undefined;
    const tag = await tagService.createTag({ title: input.title, userUid });
    res.status(201).json({ tag });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: "入力が正しくありません",
        details: err.errors,
      });
    }
    res.status(500).json({ error: err.message ?? "タグ作成に失敗しました" });
  }
}

// タグ削除
export async function deleteTag(req: Request, res: Response) {
  try {
    const input = tagIdSchema.parse({ id: req.params.id });
    const userUid = req.user?.uid ?? undefined;
    const tag = await tagService.deleteTag({ id: input.id, userUid });
    res.status(200).json({ tag, message: "タグを削除しました" });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: "入力が正しくありません",
        details: err.errors,
      });
    }
    // 権限エラーの場合は 403 を返す
    if (err.message?.includes("削除できません")) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message ?? "タグ削除に失敗しました" });
  }
}

// タグ更新
export async function updateTag(req: Request, res: Response) {
  try {
    const input = tagIdSchema.parse({ id: req.params.id });
    const { title } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        error: "タグ名が正しくありません",
      });
    }

    const userUid = req.user?.uid ?? undefined;
    const tag = await tagService.updateTag({ id: input.id, title: title.trim(), userUid });
    res.status(200).json({ tag, message: "タグを更新しました" });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: "入力が正しくありません",
        details: err.errors,
      });
    }
    // 権限エラーの場合は 403 を返す
    if (err.message?.includes("編集できません")) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message ?? "タグ更新に失敗しました" });
  }
}

// 言い訳にタグを追加
export async function addTagToExcuse(req: Request, res: Response) {
  try {
    const input = excuseTagSchema.parse(req.body);
    const excuseTag = await tagService.addTagToExcuse({
      excuseId: input.excuseId,
      tagId: input.tagId,
    });
    res.status(201).json({ excuseTag, message: "タグを追加しました" });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: "入力が正しくありません",
        details: err.errors,
      });
    }
    res.status(500).json({ error: err.message ?? "タグ追加に失敗しました" });
  }
}

// 言い訳からタグを削除
export async function removeTagFromExcuse(req: Request, res: Response) {
  try {
    const excuseId = req.params.excuseId;
    const tagId = req.params.tagId;

    if (!excuseId || !tagId) {
      return res.status(400).json({ error: "excuseIdとtagIdが必須です" });
    }

    const input = excuseTagSchema.parse({
      excuseId,
      tagId,
    });
    const excuseTag = await tagService.removeTagFromExcuse({
      excuseId: input.excuseId,
      tagId: input.tagId,
    });
    res.status(200).json({ excuseTag, message: "タグを削除しました" });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: "入力が正しくありません",
        details: err.errors,
      });
    }
    res
      .status(500)
      .json({ error: err.message ?? "タグ削除に失敗しました" });
  }
}

// 言い訳のタグ一覧取得
export async function getExcuseTags(req: Request, res: Response) {
  try {
    const excuseId = req.params.excuseId;

    if (!excuseId) {
      return res.status(400).json({ error: "excuseIdが必須です" });
    }

    const tags = await tagService.getExcuseTags({
      excuseId,
    });
    res.status(200).json({ tags });
  } catch (err: any) {
    console.error("getExcuseTags error", err);
    res.status(500).json({ error: "タグ一覧取得に失敗しました" });
  }
}

// タグに関連する言い訳を取得
export async function getExcusesByTag(req: Request, res: Response) {
  try {
    const tagId = req.params.tagId;

    if (!tagId) {
      return res.status(400).json({ error: "タグIDが必須です" });
    }

    const excuses = await tagService.getExcusesByTag({ tagId });
    return res.status(200).json({ excuses });
  } catch (err: any) {
    console.error("getExcusesByTag error:", err);
    return res.status(500).json({
      error: "言い訳の取得に失敗しました",
      details: err?.message ?? String(err),
    });
  }
}
