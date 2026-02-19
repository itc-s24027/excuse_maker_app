import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from "../../config/geminiConfig.js";

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
                    一文でまとめてください。
                    命令の復唱、返事は要りません。
                    遅刻の場合、電車以外の理由を上げてください。
                    敬語ではなく、言い切りでお願いします。
                    例：
                    - 家の鍵を忘れてしまって、入れなかった。
                    - アルバイト先から電話がかかってきて、対応していた。
                    理由を明確にしてください。
                    例：仕事の締め切りに間に合わなかった場合、「他案件でトラブルがあり、急ぎの対応を優先せざるを得ませんでした」や「急な会議」など具体的な理由を挙げてください。
                    例：友人との約束に遅れた場合、「道に迷った」や「家を出た瞬間に財布忘れたのに気づいて、取りに戻っちゃった」など具体的な理由を挙げてください。
                    例：提出物の遅延の場合、「家のネット回線が不安定」や「使っているソフトが強制終了してしまい、保存できていなかった」など具体的な理由を挙げてください。
                    例: 頼まれごとの場合、「最近、洗剤で手が荒れちゃってて、水に触るのがきついんだよね」「一週間前から腰痛がひどくて、重いものを持つのが難しい」など具体的な理由を挙げてください。
                    だめな例：「忙しかった」「忘れてた」「予想外のトラブル」「急な用事」など曖昧な理由。
                    状況: ${context}`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                maxOutputTokens: 200,
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