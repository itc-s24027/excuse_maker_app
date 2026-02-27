// テストAPI トークン受信確認用
import { Router } from "express";

const router = Router();

router.get("/auth-test", (req, res) => {
    const authHeader = req.headers.authorization;

    res.json({
        message: "トークン受信成功",
        receivedAuthorization: authHeader ?? null,
    });
});


export default router;
