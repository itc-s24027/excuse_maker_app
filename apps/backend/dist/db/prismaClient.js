// PrismaClientシングルトンラッパー
// シングルトンパターンとは、
// あるクラスのインスタンスがアプリケーション全体で
// ただ一つしか存在しないことを保証するデザインパターン
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// .env を確実に読み込む
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// import { PrismaClient } from "@prisma/client";
import { PrismaClient } from "./../../src/lib/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("環境変数「DATABASE_URL」が設定されていません");
}
// Pool を使用してコネクションプーリングを有効化
const pool = new Pool({ connectionString });
const prisma = global.__prisma ?? new PrismaClient({
    adapter: new PrismaPg(pool),
});
if (process.env.NODE_ENV !== "production")
    global.__prisma = prisma;
export default prisma;
//# sourceMappingURL=prismaClient.js.map