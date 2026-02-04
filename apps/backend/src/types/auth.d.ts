import "express";

declare global {
    namespace Express {
        interface User {
            uid: string;
            email?: string;
            name?: string;
        }

        interface Request {
            user?: User;
        }
    }
}

export {};