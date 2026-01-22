//
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./verifyFirebaseToken.js";

export const devAuth = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    req.user = {
        uid: "dev-user",
        email: "dev@example.com",
        name: "Dev User",
    };
    next();
};
