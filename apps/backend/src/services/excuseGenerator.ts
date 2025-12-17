import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from "../lib/geminiConfig.js";

type ExcuseResult = {
    text: string;
};

// gemini/initialization.tsからユーザが入力したプロンプトを受け取って、言い訳を生成する関数にする
export async function generateExcuse(
    context: string
): Promise<ExcuseResult> {
    const apiKey = getGeminiApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const modelName = 'gemini-2.5-flash-lite';

    // ユーザーが入力した「言い訳が必要な状況」をプロンプトに入れる
    const prompt = `以下の状況に合った、自然で説得力のある言い訳を考えてください。
                    ただし、言い訳は短く、一つの文でまとめてください。
                    沖縄在住なので電車はなく、バスやモノレール、車、自転車、徒歩などの交通手段を考慮してください。
                    命令の復唱は要りません。100トークン以内で候補を３つ挙げてください。

                    状況: ${context}`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                maxOutputTokens: 100,
            },
        });

        // 応答を返す
        if (!response.text) {
            throw new Error("Geminiの応答が空です")
        }
        return {
            text: response.text,
        };

    } catch (error) {
        console.error("Gemini 実行エラー:", error);
        // エラーを呼び出し元に投げる
        throw new Error("Geminiからの言い訳を生成できませんでした。");
    }
}