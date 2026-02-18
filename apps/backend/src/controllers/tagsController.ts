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
    const tag = await tagService.createTag({ title: input.title });
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
    const tag = await tagService.deleteTag({ id: input.id });
    res.status(200).json({ tag, message: "タグを削除しました" });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: "入力が正しくありません",
        details: err.errors,
      });
    }
    res.status(500).json({ error: err.message ?? "タグ削除に失敗しました" });
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
    const input = excuseTagSchema.parse({
      excuseId: req.params.excuseId,
      tagId: req.params.tagId,
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
    const tags = await tagService.getExcuseTags({
      excuseId: req.params.excuseId,
    });
    res.status(200).json({ tags });
  } catch (err: any) {
    console.error("getExcuseTags error", err);
    res.status(500).json({ error: "タグ一覧取得に失敗しました" });
  }
}

