import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 読み込み
dotenv.config({ path: path.resolve(__dirname, "../.env") });
process.env.DOTENV_LOADED = "true";


import init from "./routes/gemini/initialization.js";
import init_mock from "./routes/gemini/initialization.mock.js"
import setup from "./routes/proxy/setupProxy.js";
import testRouter from "./routes/auth/test.js";
import authRouter from "./routes/auth/user.js"
import chatsRouter from "./routes/chats.js";

const useMock = process.env.ENABLE_GEMINI !== "true";


const app = express();

// 他ドメインからのリクエスト許可
app.use(cors());
app.use(express.json());

app.use("/api", useMock ? init_mock : init);
app.use("/api", setup);
app.use("/api/test", testRouter);
app.use("/api/auth", authRouter);

// チャット関連のルーティング
app.use("/api/chats", chatsRouter);

// サーバーを起動してログをだす（待機状態にする）
const port = process.env.PORT || '3001';
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});

export default app;