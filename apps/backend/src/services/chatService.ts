import prisma from "../db/prismaClient.js";

/**
 * Chat 作成（＋最初の Excuse 作成）
 */
export async function createChat({
                                     title,
                                     userUid,
                                 }: {
    title: string;
    userUid: string;
}) {
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
export async function getChatsByUser(userUid: string) {
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
export async function getChatDetail(chatId: string, userUid: string) {
    const row = await prisma.chat.findFirst({
        where: {
            id: chatId,
            user: { uid: userUid },
        },
        include: {
            excuses: true,
        },
    });
    if (!row) throw new Error("Chat not found");
    return row;
}

/**
 * 言い訳（excuse）の評価を更新する
 * input: { excuseId, success }
 */
export async function updateEvaluation({ excuseId, success }: { excuseId: string; success: boolean }) {
    const updated = await prisma.excuse.update({
        where: { id: excuseId },
        data: { success },
    });
    return updated;
}

/**
 * チャット削除（論理削除：isDeletedフラグをtrueに設定）
 */
export async function deleteChat({ chatId, userUid }: { chatId: string; userUid: string }) {
    return prisma.$transaction(async (tx) => {
        const chat = await tx.chat.findUnique({ where: { id: chatId }, include: { user: true } });
        if (!chat) throw new Error("Chat not found");
        // user relation からユーザー識別子を確認
        if ((chat.user as any)?.uid && (chat.user as any).uid !== userUid) {
            throw new Error("Forbidden");
        }
        // 論理削除：isDeletedをtrueに設定
        await tx.chat.update({
            where: { id: chatId },
            data: { isDeleted: true },
        });
    });
}
