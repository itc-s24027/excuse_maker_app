import prisma from "../db/prismaClient.js";
/**
 * Chat 作成（＋最初の Excuse 作成）
 */
export async function createChat({ title, userUid, }) {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { uid: userUid },
        });
        if (!user) {
            throw new Error("User not found for uid: " + userUid);
        }
        const chat = await tx.chat.create({
            data: {
                title,
                user: {
                    connect: { id: user.id },
                },
            },
        });
        return { chat };
    });
}
/**
 * 指定ユーザーのチャット一覧を取得する（簡易）
 */
export async function getChatsByUser(userUid) {
    const rows = await prisma.chat.findMany({
        where: {
            user: { uid: userUid },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            createdAt: true,
        },
    });
    return rows;
}
/**
 * チャット詳細を取得する（チャットとその言い訳一覧）
 */
export async function getChatDetail(chatId, userUid) {
    const row = await prisma.chat.findFirst({
        where: {
            id: chatId,
            user: { uid: userUid },
        },
        include: {
            excuses: true,
        },
    });
    if (!row)
        throw new Error("Chat not found");
    return row;
}
/**
 * 言い訳（excuse）の評価を更新する
 * input: { excuseId, success }
 */
export async function updateEvaluation({ excuseId, success }) {
    const updated = await prisma.excuse.update({
        where: { id: excuseId },
        data: { success },
    });
    return updated;
}
/**
 * チャット削除（ユーザー所有チェックを行い、関連する言い訳を削除）
 */
export async function deleteChat({ chatId, userUid }) {
    return prisma.$transaction(async (tx) => {
        const chat = await tx.chat.findUnique({ where: { id: chatId }, include: { user: true } });
        if (!chat)
            throw new Error("Chat not found");
        // user relation からユーザー識別子を確認
        if (chat.user?.uid && chat.user.uid !== userUid) {
            throw new Error("Forbidden");
        }
        await tx.excuse.deleteMany({ where: { chatId } });
        await tx.chat.delete({ where: { id: chatId } });
    });
}
/**
 * 言い訳を保存（複数タグ付き）
 */
export async function saveExcuse({ chatId, excuseText, situation, tagIds, }) {
    return prisma.$transaction(async (tx) => {
        // 言い訳を作成
        const excuse = await tx.excuse.create({
            data: {
                chatId,
                excuseText,
                situation,
                success: true,
            },
        });
        // タグを関連付け（複数）
        if (tagIds && tagIds.length > 0) {
            await tx.excuseTag.createMany({
                data: tagIds.map((tagId) => ({
                    excuseId: excuse.id,
                    tagId,
                })),
            });
        }
        return { excuse };
    });
}
/**
 * いいねを追加
 */
export async function addLike({ excuseId, userUid, }) {
    const user = await prisma.user.findUnique({
        where: { uid: userUid },
    });
    if (!user) {
        throw new Error("User not found");
    }
    const excuse = await prisma.excuse.findUnique({
        where: { id: excuseId },
    });
    if (!excuse) {
        throw new Error("Excuse not found");
    }
    // 既にいいねしているかチェック
    const existing = await prisma.like.findUnique({
        where: { userId_excuseId: { userId: user.id, excuseId } },
    });
    if (existing) {
        // 削除マークがあれば復活させる
        if (existing.isDeleted) {
            const updated = await prisma.like.update({
                where: { id: existing.id },
                data: { isDeleted: false },
            });
            return updated;
        }
        throw new Error("Already liked");
    }
    const like = await prisma.like.create({
        data: {
            userId: user.id,
            excuseId,
        },
    });
    return like;
}
/**
 * いいねを削除（論理削除）
 */
export async function removeLike({ excuseId, userUid, }) {
    const user = await prisma.user.findUnique({
        where: { uid: userUid },
    });
    if (!user) {
        throw new Error("User not found");
    }
    const like = await prisma.like.findUnique({
        where: { userId_excuseId: { userId: user.id, excuseId } },
    });
    if (!like) {
        throw new Error("Like not found");
    }
    const updated = await prisma.like.update({
        where: { id: like.id },
        data: { isDeleted: true },
    });
    return updated;
}
/**
 * 言い訳のいいね情報を取得
 */
export async function getLikeInfo({ excuseId, userUid, }) {
    const likes = await prisma.like.findMany({
        where: {
            excuseId,
            isDeleted: false,
        },
    });
    let userLiked = false;
    if (userUid) {
        const user = await prisma.user.findUnique({
            where: { uid: userUid },
        });
        if (user) {
            userLiked = likes.some((like) => like.userId === user.id);
        }
    }
    return {
        likeCount: likes.length,
        userLiked,
    };
}
//# sourceMappingURL=chatService.js.map