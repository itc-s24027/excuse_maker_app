// 認証関連のユーザー情報を扱う
import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth/index.js";
import prisma from "../../db/prismaClient.js";

const router = Router();

// 認証されたユーザー情報を取得する==========================================================
router.get("/me", (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "未認証ユーザーです" });
    }
    return res.json({ user: req.user });
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
                user: User
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
            user: newUser
        })

    } catch (error) {
        console.log("ユーザー登録エラー:", error);
        return res.status(500).json({ message: "ユーザー登録に失敗しました" });
    }
});

export default router;
