// `apps/backend/src/app.ts` (修正後)

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import test from "./routes/test.ts";
import { initializeGeminiTest } from "./initializers/gemini.ts";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 読み込み (変更なし)
dotenv.config({ path: path.resolve(__dirname, "../.env") });
process.env.DOTENV_LOADED = "true";


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/test", test);

const port = process.env.PORT || '3001';
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);


    void initializeGeminiTest();
});

export default app;