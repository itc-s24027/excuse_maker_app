// `apps/backend/src/app.ts`
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import test from "./routes/test.ts";
import { generateExcuse } from "./services/geminiTest.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 修正: 一つ上のディレクトリにある `apps/backend/.env` を読み込む
dotenv.config({ path: path.resolve(__dirname, "../.env") });
process.env.DOTENV_LOADED = "true";


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/test", test);

const port = process.env.PORT || '3001';
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);

    if (process.env.ENABLE_GEMINI === "true") {
        // テスト用の状況を引数として渡す
        generateExcuse("学校に遅刻しそう")
            .then(excuse => {
                console.log("--- Gemini (言い訳生成) 初期テスト完了 ---");
                console.log(`生成された言い訳:\n${excuse}`);
            })
            .catch((err: unknown) => { // エラーの型も unknown にしておくと安心だ
                console.error("Failed to run Gemini test:", err);
            });
    } else {
        console.log("Gemini init skipped (ENABLE_GEMINI not true)");
    }
});

export default app;
