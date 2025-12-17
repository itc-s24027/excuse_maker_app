// 言い訳生成API
import {Router} from "express";
import { isGeminiEnabled } from "../../lib/geminiConfig.js";
import { generateExcuse } from "../../services/excuseGenerator.js";

const router = Router();

router.get("/gemini-test", async (req, res) => {
    if (!isGeminiEnabled()) {
        return res.status(503).json({ message: "Geminiは有効になっていません" });
    }
    try {
        // services/excuseGenerator.jsで言い訳を生成して返す
        const excuse = await generateExcuse("学校に遅刻しそう");
        res.json({ excuse: excuse.text });
    } catch (err) {
        res.status(500).json({ message: "言い訳生成に失敗しました"});
        console.log(err);
    }
});

export default router;