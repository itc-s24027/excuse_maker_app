import {Router} from "express";

const router = Router();

router.get("/hello", (req, res) => {
    res.json({ status: "バックエンドは働いていますヨーーー！" });
})
export default router;