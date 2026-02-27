// タグapiのサービス層
import prisma from "../db/prismaClient.js";

// 全タグ取得（システムタグのみ）
export async function getAllTags() {
  const tags = await prisma.tag.findMany({
    orderBy: { createdAt: "asc" },
  });
  return tags;
}

// タグ新規作成（無効化：システムタグのみなので無効）
export async function createTag({ title, userUid }: { title: string; userUid: string | undefined }) {
  throw new Error("タグ作成は無効です。システム管理者のみがタグを管理できます。");
}

// タグ削除（無効化：システムタグのみなので無効）
export async function deleteTag({ id, userUid }: { id: string; userUid: string | undefined }) {
  throw new Error("タグ削除は無効です。システム管理者のみがタグを管理できます。");
}

// タグ名を更新（無効化：システムタグのみなので無効）
export async function updateTag({ id, title, userUid }: { id: string; title: string; userUid: string | undefined }) {
  throw new Error("タグ更新は無効です。システム管理者のみがタグを管理できます。");
}

// 言い訳にタグを追加
export async function addTagToExcuse({
  excuseId,
  tagId,
}: {
  excuseId: string;
  tagId: string;
}) {
  const excuse = await prisma.excuse.findUnique({ where: { id: excuseId } });
  if (!excuse) throw new Error("言い訳が見つかりません");

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) throw new Error("タグが見つかりません");

  // 既に追加されている場合はスキップ
  const exists = await prisma.excuseTag.findUnique({
    where: { excuseId_tagId: { excuseId, tagId } },
  });
  if (exists) throw new Error("既にこのタグが追加されています");

  const excuseTag = await prisma.excuseTag.create({
    data: { excuseId, tagId },
  });
  return excuseTag;
}

// 言い訳からタグを削除
export async function removeTagFromExcuse({
  excuseId,
  tagId,
}: {
  excuseId: string;
  tagId: string;
}) {
  const excuseTag = await prisma.excuseTag.findUnique({
    where: { excuseId_tagId: { excuseId, tagId } },
  });
  if (!excuseTag) throw new Error("タグが紐付けられていません");

  await prisma.excuseTag.delete({
    where: { excuseId_tagId: { excuseId, tagId } },
  });
  return excuseTag;
}

// 言い訳のタグ一覧取得
export async function getExcuseTags({ excuseId }: { excuseId: string }) {
  const tags = await prisma.excuseTag.findMany({
    where: { excuseId },
    include: { tag: true },
  });
  return tags.map((et) => et.tag);
}

// タグに関連する言い訳を取得（いいね数でソート）
export async function getExcusesByTag({ tagId }: { tagId: string }) {
  // タグ情報を取得
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });

  if (!tag) {
    throw new Error("タグが見つかりません");
  }

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
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
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

  return { tag, excuses: excusesWithLikeCounts };
}
