// ミドルウェア切り替え
import * as dotenv from "dotenv";
import { verifyFirebaseToken } from "./verifyFirebaseToken.js";
import { devAuth } from "./devAuth.js";

dotenv.config();
const isDev =
    // 開発環境かつ認証スキップが有効な場合
    process.env.SKIP_AUTH === "true";

export const authMiddleware = isDev
    ? devAuth
    : verifyFirebaseToken;
