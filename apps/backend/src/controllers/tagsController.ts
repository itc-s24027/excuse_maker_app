import type { Request, Response } from "express";
import {
  createTagSchema,
  tagIdSchema,
  excuseTagSchema,
} from "../validators/tagSchemas.js";
import * as tagService from "../services/tagService.js";

// 全タグ取得（システムタグのみ）
export async function getAllTags(req: Request, res: Response) {
  try {
    const tags = await tagService.getAllTags();
    res.status(200).json({ tags });
  } catch (err: any) {
    console.error("getAllTags error", err);
    res.status(500).json({ error: "タグ一覧取得に失敗しました" });
  }
}

// タグ新規作成（無効化：システムタグのみなので無効）
export async function createTag(req: Request, res: Response) {
  res.status(403).json({
    error: "タグ作成は無効です。システム管理者のみがタグを管理できます。",
  });
}

// タグ削除（無効化：システムタグのみなので無効）
export async function deleteTag(req: Request, res: Response) {
  res.status(403).json({
    error: "タグ削除は無効です。システム管理者のみがタグを管理できます。",
  });
}

// タグ更新（無効化：システムタグのみなので無効）
export async function updateTag(req: Request, res: Response) {
  res.status(403).json({
    error: "タグ更新は無効です。システム管理者のみがタグを管理できます。",
  });
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

    const result = await tagService.getExcusesByTag({ tagId });
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("getExcusesByTag error:", err);
    return res.status(500).json({
      error: "言い訳の取得に失敗しました",
      details: err?.message ?? String(err),
    });
  }
}
