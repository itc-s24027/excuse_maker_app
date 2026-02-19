// タグapiのサービス層
import prisma from "../db/prismaClient.js";
// 全タグ取得（削除されていないタグのみ）
export async function getAllTags() {
    const tags = await prisma.tag.findMany({
        where: {
            isDeleted: false,
        },
        select: {
            id: true,
            title: true,
            isSystemTag: true,
            isDeleted: true,
            createdAt: true,
            userId: true,
            user: {
                select: {
                    id: true,
                    nickname: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return tags;
}
// タグ新規作成
export async function createTag({ title, userUid }) {
    // タイトルの重複チェック
    const exists = await prisma.tag.findUnique({ where: { title } });
    if (exists)
        throw new Error("同じタイトルのタグが既に存在します");
    let userId = null;
    if (userUid) {
        const user = await prisma.user.findUnique({ where: { uid: userUid } });
        if (!user)
            throw new Error("User not found");
        userId = user.id;
    }
    const tag = await prisma.tag.create({
        data: { title, userId },
    });
    return tag;
}
// タグ削除（論理削除）
export async function deleteTag({ id, userUid }) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag)
        throw new Error("タグが見つかりません");
    // システムタグは削除不可
    if (tag.isSystemTag) {
        throw new Error("システムタグは削除できません");
    }
    // 作成者のみが削除可能
    if (userUid) {
        const user = await prisma.user.findUnique({ where: { uid: userUid } });
        if (!user)
            throw new Error("User not found");
        if (tag.userId !== user.id) {
            throw new Error("このタグは削除できません（作成者のみが削除可能です）");
        }
    }
    // 論理削除
    const deletedTag = await prisma.tag.update({
        where: { id },
        data: { isDeleted: true },
    });
    return deletedTag;
}
// タグ名を更新
export async function updateTag({ id, title, userUid }) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag)
        throw new Error("タグが見つかりません");
    // システムタグは編集不可
    if (tag.isSystemTag) {
        throw new Error("システムタグは編集できません");
    }
    // 作成者のみが編集可能
    if (userUid) {
        const user = await prisma.user.findUnique({ where: { uid: userUid } });
        if (!user)
            throw new Error("User not found");
        if (tag.userId !== user.id) {
            throw new Error("このタグは編集できません（作成者のみが編集可能です）");
        }
    }
    // タイトルの重複チェック（同じタイトルは許可）
    if (title !== tag.title) {
        const exists = await prisma.tag.findUnique({ where: { title } });
        if (exists)
            throw new Error("同じタイトルのタグが既に存在します");
    }
    const updatedTag = await prisma.tag.update({
        where: { id },
        data: { title },
        include: {
            user: {
                select: {
                    id: true,
                    nickname: true,
                    email: true,
                },
            },
        },
    });
    return updatedTag;
}
// 言い訳にタグを追加
export async function addTagToExcuse({ excuseId, tagId, }) {
    const excuse = await prisma.excuse.findUnique({ where: { id: excuseId } });
    if (!excuse)
        throw new Error("言い訳が見つかりません");
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag)
        throw new Error("タグが見つかりません");
    // 既に追加されている場合はスキップ
    const exists = await prisma.excuseTag.findUnique({
        where: { excuseId_tagId: { excuseId, tagId } },
    });
    if (exists)
        throw new Error("既にこのタグが追加されています");
    const excuseTag = await prisma.excuseTag.create({
        data: { excuseId, tagId },
    });
    return excuseTag;
}
// 言い訳からタグを削除
export async function removeTagFromExcuse({ excuseId, tagId, }) {
    const excuseTag = await prisma.excuseTag.findUnique({
        where: { excuseId_tagId: { excuseId, tagId } },
    });
    if (!excuseTag)
        throw new Error("タグが紐付けられていません");
    await prisma.excuseTag.delete({
        where: { excuseId_tagId: { excuseId, tagId } },
    });
    return excuseTag;
}
// 言い訳のタグ一覧取得
export async function getExcuseTags({ excuseId }) {
    const tags = await prisma.excuseTag.findMany({
        where: { excuseId },
        include: { tag: true },
    });
    return tags.map((et) => et.tag);
}
// タグに関連する言い訳を取得（いいね数でソート）
export async function getExcusesByTag({ tagId }) {
    const excuses = await prisma.excuse.findMany({
        where: {
            tags: {
                some: {
                    tagId: tagId,
                },
            },
            isDeleted: false,
        },
        include: {
            chat: {
                select: {
                    id: true,
                    title: true,
                },
            },
            tags: {
                include: {
                    tag: true,
                },
            },
            likes: {
                where: {
                    isDeleted: false,
                },
                select: {
                    id: true,
                    userId: true,
                },
            },
        },
    });
    // クライアント側でいいね数を計算し、その数でソート
    const excusesWithLikeCounts = excuses.map((excuse) => ({
        ...excuse,
        likeCount: excuse.likes.length,
    }));
    // いいね数が多い順にソート（同じ場合は作成日時で降順）
    excusesWithLikeCounts.sort((a, b) => {
        if (b.likeCount !== a.likeCount) {
            return b.likeCount - a.likeCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return excusesWithLikeCounts;
}
//# sourceMappingURL=tagService.js.map