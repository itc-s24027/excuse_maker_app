export const devAuth = (req, _res, next) => {
    req.user = {
        uid: "dev-user",
        email: "dev@example.com",
        name: "Dev User",
    };
    next();
};
//# sourceMappingURL=devAuth.js.map