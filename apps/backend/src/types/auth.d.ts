import "express";

declare global {
    namespace Express {
        interface User {
            uid: string;
        }
    }
}
