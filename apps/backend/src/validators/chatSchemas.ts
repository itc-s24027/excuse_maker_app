// zod スキーマ等

// 目的: ルート受け取りデータのバリデーションを統一して失敗時に早期に返す。create と evaluation 用のスキーマを用意。
// 方針: zod を使い、型推論で TypeScript 型も生成する。

import { z } from "zod";

// チャット作成用スキーマ
export const createChatSchema = z.object({
    title: z.string().min(1, "タイトルを入力してください").max(255),            // タイトル
    situation: z.string().min(1, "状況を入力してください").max(5000),          // 状況
    tags: z.array(z.string().min(1, "タグを一つ以上指定してください").max(36))   // タグ
});

// チャット作成用入力型
export type CreateChatInput = z.infer<typeof createChatSchema>; // タイトル、状況、タグを含む型

// チャット評価用スキーマ
export const evaluationSchema = z.object({
    success: z.union([z.boolean(), z.null()]), // true成功 / false失敗 / null未評価
});

// チャット評価用入力型
export type EvaluationInput = z.infer<typeof evaluationSchema>; // success フィールドのみを含む型