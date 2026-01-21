import { User } from "@prisma/client";

declare global {
    namespace Express {
        interface Request {
            user: {
                uid: string;
                // 必要なら追加
                // email?: string;
            };
        }
    }
}

export {};
