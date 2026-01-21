
export function isGeminiEnabled() {
    return process.env.ENABLE_GEMINI === "true";
}

// gemini APIを呼び出すために環境変数からAPIキーを取得
export function getGeminiApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY 環境変数が設定されていません。");
    }
    return apiKey;
}
