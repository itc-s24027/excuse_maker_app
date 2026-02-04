// Firebaseトークンを検証するミドルウェア
// これをapiルートに適用して、認証されたユーザーのみがアクセスできるようする
import type　{ Request, Response, NextFunction } from "express";
import { getFirebaseAdmin } from "../../config/firebaseAdmin.js";


// Firebaseトークンを検証するミドルウェア
export const verifyFirebaseToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    if (!req.headers.authorization?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "トークンなし" });
    }

    // トークンを抽出
    const token = req.headers.authorization.split(" ")[1];
    // トークンが存在しない場合の処理
    if (!token) {
        return res.status(401).json({ message: "トークン形式が不正" });
    }

    try {
        const firebaseAdmin = getFirebaseAdmin();
        const decoded = await firebaseAdmin.auth().verifyIdToken(token);
        console.log("デコード成功");
        req.user = {
            uid: decoded.uid,
            ...(decoded.email ? { email: decoded.email } : {}),
            ...(decoded.name ? { name: decoded.name } : {}),
        };
        // 認証成功、次のミドルウェアまたはルートハンドラーへ
        next();
    } catch (error) {
        console.error("verifyIdToken エラー:", error);
        return res.status(401).json({ message: "トークン無効" });
    }
};