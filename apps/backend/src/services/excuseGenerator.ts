import { GoogleGenAI } from '@google/genai';

// 外部からプロンプトを受け取って言い訳を生成する関数
export async function generateExcuse(context: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY 環境変数が設定されていません。app.ts の起動時にロードされるはずです。");
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = 'gemini-2.5-flash-lite';

    // ユーザーが入力した「言い訳が必要な状況」をプロンプトに入れるぜ
    const prompt = `以下の状況に合った、自然で説得力のある言い訳を考えてください。ただし、言い訳は短く、一つの文でまとめてください。沖縄在住なので電車はなく、バスやモノレール、車、自転車、徒歩などの交通手段を考慮してください。命令の復唱は要りません。100トークン以内で候補を３つ挙げてください。

状況: ${context}`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                maxOutputTokens: 100,
            },
        });

        // 応答のテキストを返すようにする
        return response.text || "";
    } catch (error) {
        console.error("Gemini 実行エラー:", error);
        // エラーを呼び出し元に投げる
        throw new Error("Geminiからの言い訳を生成できませんでした。");
    }
}