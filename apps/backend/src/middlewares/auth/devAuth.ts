import type { Request, Response, NextFunction } from "express";

export const devAuth = (
    req: Request,
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
