// apps/backend/src/initializers/gemini.ts

import { generateExcuse } from "../services/excuseGenerator.ts";

/**
 * サーバー起動時にGemini APIのテストを実行する
 * @returns Promise<void>
 */
export async function initializeGeminiTest() {
    if (process.env.ENABLE_GEMINI === "true") {
        try {
            console.log("--- 言い訳生成中 ---");
            const excuse = await generateExcuse("学校に遅刻しそう");
            console.log(`生成された言い訳:\n${excuse}`);
        } catch (err) {
            console.error("Geminiの初期化テストの実行に失敗しました:", err);
        }
    } else {
        console.log("Geminiの初期化をスキップしました（ENABLE_GEMINIがtrueではありません）");
    }
}