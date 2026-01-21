// トークン認証を付与したfetch
import { getIdToken } from "./getIdToken";

export async function apifetch(
    url: string,
    options: RequestInit = {}
) {
    const token = await getIdToken();
    if (!token) {
        throw new Error("未認証ユーザーです（トークンなし）");
    }

    return fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });
}
