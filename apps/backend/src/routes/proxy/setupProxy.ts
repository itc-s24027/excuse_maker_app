// フロントからのリクエストをバックエンドのAPIにプロキシする
import {Router} from "express";

const router = Router();
const API_URL = process.env.API_URL;

router.get('/gemini-test', async (req, res) => {
    try {
        const response = await fetch(`${API_URL}/api/gemini-test`);
        if (!response.ok) {
            throw new Error('バックエンドAPIの呼び出し失敗');
        }
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('APIプロキシエラー', error);
        res.status(500).json({ error: 'API呼び出し失敗' });
    }
});

export default router;
