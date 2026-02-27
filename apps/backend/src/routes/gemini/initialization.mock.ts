// 言い訳生成API: モック or 実際のAPI を環境変数で切り替え
import { Router } from "express";
import { generateExcuseMock } from "../../services/excuse/generateExcuse.mock.js";
import { generateExcuse } from "../../services/excuse/generateExcuse.gemini.js";
import { authMiddleware } from "../../middlewares/auth/index.js";
import prisma from "../../db/prismaClient.js";

const router = Router();
const USE_REAL_API = process.env.ENABLE_GEMINI === "true";

router.post("/gemini-test", authMiddleware, async (req, res) => {
    try {
        const { chatId, situation } = req.body;

        if (!chatId || !situation) {
            return res.status(400).json({ error: "chatId と situation が必要です" });
        }

        // チャットが存在することを確認
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // 言い訳を生成（実際のAPIまたはモック）
        let excuseResult;
        if (USE_REAL_API) {
            console.log("実際のGemini APIを使用します");
            excuseResult = await generateExcuse(situation);
        } else {
            console.log("モック APIを使用します");
            excuseResult = await generateExcuseMock(situation);
        }

        // DB に保存
        const saved = await prisma.excuse.create({
            data: {
                chatId,
                situation,
                excuseText: excuseResult.text,
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