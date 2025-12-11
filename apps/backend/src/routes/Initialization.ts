import {Router} from "express";
import {generateExcuse} from "../services/geminiTest.js";

const router = Router();

router.get("/gemini-test", async (req, res) => {
    if (process.env.ENABLE_GEMINI !== "true") {
        return res.status(400).json({ message: "Geminiは有効になっていません" });
    }
    try {
        const excuse = await generateExcuse("学校に遅刻しそう");
        res.json({ excuse });
    } catch (err) {
        res.status(500).json({ message: "言い訳生成に失敗しました", error: err });
    }
});

export default router;