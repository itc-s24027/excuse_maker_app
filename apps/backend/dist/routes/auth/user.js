// 認証関連のユーザー情報を扱う
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth/index.js";
import prisma from "../../db/prismaClient.js";
const router = Router();
// 認証されたユーザー情報を取得する==========================================================
router.get("/me", authMiddleware, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "未認証ユーザーです" });
    }
    const { uid } = req.user;
    try {
        const user = await prisma.user.findUnique({
            where: { uid },
        });
        if (!user) {
            return res.status(404).json({ message: "ユーザーが見つかりません" });
        }
        return res.json({
            id: user.id,
            uid: user.uid,
            email: user.email,
            nickname: user.nickname,
        });
    }
    catch (error) {
        console.log("ユーザー情報取得エラー:", error);
        return res.status(500).json({ message: "ユーザー情報の取得に失敗" });
    }
});
// ユーザー情報をDBに登録する===============================================================
router.post("/register", authMiddleware, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "認証情報がありません" });
    }
    const { uid, email, name } = req.user;
    try {
        const User = await prisma.user.findUnique({
            where: { uid },
        });
        if (!email) {
            return res.status(400).json({
                message: "email が取得できません"
            });
        }
        if (User) {
            return res.status(200).json({
                message: "ユーザーは既に登録されています",
                user: User,
                isNewUser: false,
            });
        }
        const newUser = await prisma.user.create({
            data: {
                uid,
                email,
                ...(name !== undefined ? { nickname: name } : {}),
            },
        });
        return res.status(200).json({
            message: "ユーザー登録成功",
            user: newUser,
            isNewUser: true,
        });
    }
    catch (error) {
        console.log("ユーザー登録エラー:", error);
        return res.status(500).json({ message: "ユーザー登録に失敗しました" });
    }
});
export default router;
// ユーザーの名前を更新する===============================================================
router.put("/update", authMiddleware, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "認証情報がありません" });
    }
    const { uid } = req.user;
    const { nickname } = req.body;
    // 名前の入力チェック
    if (!nickname || nickname.trim() === "") {
        return res.status(400).json({ message: "名前の入力がありません" });
    }
    try {
        // ユーザーの存在確認
        const user = await prisma.user.findUnique({
            where: { uid },
        });
        if (!user) {
            return res.status(404).json({ message: "ユーザーが見つかりません" });
        }
        // ユーザー名の更新
        const updatedUser = await prisma.user.update({
            where: { uid },
            data: { nickname },
        });
        return res.status(200).json({
            nickname: updatedUser,
        });
    }
    catch (error) {
        console.log("ユーザー名の更新失敗：", error);
        return res.status(500).json({ message: "ユーザー名の更新に失敗しました" });
    }
});
//# sourceMappingURL=user.js.map