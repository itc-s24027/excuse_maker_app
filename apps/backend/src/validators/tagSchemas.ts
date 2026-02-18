// タグ関連のバリデーションスキーマを定義するファイル
import { z } from "zod";

export const createTagSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(36, "タイトルは36文字以内です"),
});

export const tagIdSchema = z.object({
  id: z.string().min(1, "タグIDは必須です"),
});

export const excuseTagSchema = z.object({
  excuseId: z.string().min(1, "言い訳IDは必須です"),
  tagId: z.string().min(1, "タグIDは必須です"),
});

