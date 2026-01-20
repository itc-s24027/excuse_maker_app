// Firebase ID token 検証ミドルウェア

import { Request, Response, NextFunction } from "express";
import admin from "../lib/firebaseadmin.js";

export default async function auth(req: Request, res: Response, next: NextFunction) {
    const header = req.header("Authorization") ?? "";
    const token = header.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "no token" });

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        (req as any).user = { uid: decoded.uid, email: decoded.email };
        next();
    } catch (err) {
        res.status(401).json({ error: "invalid token" });
    }
}
