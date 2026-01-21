// 言い訳生成API: モック
import { Router } from "express";
import { generateExcuseMock } from "../../services/excuse/generateExcuse.mock.js";
import { verifyFirebaseToken } from "../../middleware/auth.js";

const router = Router();

router.get("/gemini-test", verifyFirebaseToken, async (req, res) => {
    try {
        // services/excuseGenerator.jsで言い訳を生成して返す
        const excuse = await generateExcuseMock("学校に遅刻しそう");
        res.json({ excuse: excuse.text });
    } catch (err) {
        res.status(500).json({ message: "言い訳生成に失敗しました"});
        console.log(err);
    }
});

export default router;