// zod スキーマ等
// 目的: ルート受け取りデータのバリデーションを統一して失敗時に早期に返す。create と evaluation 用のスキーマを用意。
// 方針: zod を使い、型推論で TypeScript 型も生成する。
import { z } from "zod";
// チャット作成用スキーマ
export const createChatSchema = z.object({
    title: z.string().min(1, "タイトルを入力してください").max(255), // タイトル
});
export const evaluationSchema = z.object({
    excuseId: z.string().uuid(),
    success: z.boolean(),
});
//# sourceMappingURL=chatSchemas.js.map