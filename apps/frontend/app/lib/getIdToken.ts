// 認証済みユーザーのIDトークンを取得する関数
import { auth } from "@/app/lib/firebase";

export const getIdToken = async (force: boolean = false): Promise<string | null> => {
    return new Promise((resolve) => {
        const user = auth.currentUser;
        if (user) {
            user.getIdToken(force).then(resolve).catch(() => resolve(null));
        } else {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                if (user) {
                    user.getIdToken(force).then(resolve).catch(() => resolve(null));
                } else {
                    resolve(null);
                }
            });
        }
    });
};