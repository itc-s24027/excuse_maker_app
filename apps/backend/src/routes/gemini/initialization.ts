// 言い訳生成API
import {Router} from "express";
import { isGeminiEnabled } from "../../config/geminiConfig.js";
import { generateExcuse } from "../../services/excuse/generateExcuse.gemini.js";
import { authMiddleware } from "../../middlewares/auth/index.js";
import prisma from "../../db/prismaClient.js";


const router = Router();

router.get("/gemini-test",authMiddleware, async (req, res) => {
    if (!isGeminiEnabled()) {
        return res.status(503).json({ message: "Geminiは有効になっていません" });
    }

    // クエリパラメータから situation を取得
    const situation = typeof req.query.situation === "string" ? req.query.situation.trim() : "";

    // situation が提供されていない場合はエラーを返す
    if (!situation) {
        return res.status(400).json({ message: "パラメータ 'situation' が必要です" });
    }

    try {
        // services/excuseGenerator.jsで言い訳を生成して返す
        const excuse = await generateExcuse(situation);
        res.json({ excuse: excuse.text });
    } catch (err) {
        res.status(500).json({ message: "言い訳生成に失敗しました"});
        console.log(err);
    }
});

// POST エンドポイント：chatId と situation を受け取り、言い訳を生成して DB に保存
router.post("/gemini-test", authMiddleware, async (req, res) => {
    try {
        if (!isGeminiEnabled()) {
            return res.status(503).json({ message: "Geminiは有効になっていません" });
        }

        const { chatId, situation } = req.body;

        if (!chatId || !situation) {
            return res.status(400).json({ error: "chatId と situation が必要です" });
        }

        // チャットが存在することを確認
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // 言い訳を生成
        const excuse = await generateExcuse(situation);

        // DB に保存
        const saved = await prisma.excuse.create({
            data: {
                chatId,
                situation,
                excuseText: excuse.text,
                success: null,  // 未判定
                isDeleted: false,
            },
        });

        res.json({
            excuse: saved.excuseText,
            excuseId: saved.id,
        });
    } catch (err) {
        res.status(500).json({
            error: "言い訳生成に失敗しました",
            details: (err as Error).message,
        });
        console.error("言い訳生成エラー:", err);
    }
});

export default router;