// トークン認証を付与したfetch
import { getIdToken } from "./getIdToken";

export async function apifetch(
    url: string,
    options: RequestInit = {},
    skipAuth: boolean = false
) {
    // skipAuth が true の場合はトークンなしで fetch
    if (skipAuth) {
        return fetch(url, options);
    }

    // 最初のトークンを取得
    let token = await getIdToken();
    if (!token) {
        throw new Error("未認証ユーザーです（トークンなし）");
    }

    const doFetch = async (tok: string | null) => {
        return fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
            },
        });
    };

    // 1回目実行
    let res = await doFetch(token);

    // 401 の場合はトークンを強制再取得して再試行（1回）
    if (res.status === 401) {
        try {
            const newToken = await getIdToken(true);
            if (newToken && newToken !== token) {
                token = newToken;
                res = await doFetch(token);
            }
        } catch (e) {
            // 再取得失敗したらそのまま res を返す
            console.warn("トークン再取得に失敗しました", e);
        }
    }

    return res;
}
