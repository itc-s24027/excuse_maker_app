import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import init from "./routes/gemini/initialization.js";
import setup from "./routes/proxy/setupProxy.js";

// .env 読み込み
dotenv.config({ path: path.resolve(__dirname, "../.env") });
process.env.DOTENV_LOADED = "true";


const app = express();

// 他ドメインからのリクエスト許可
app.use(cors());

app.use(express.json());

app.use("/api", init);
app.use("/api", setup);

// サーバーを起動してログをだす（待機状態にする）
const port = process.env.PORT || '3001';
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});

export default app;