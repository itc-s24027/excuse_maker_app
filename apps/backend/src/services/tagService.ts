// タグapiのサービス層
import prisma from "../db/prismaClient.js";

// 全タグ取得
export async function getAllTags() {
  const tags = await prisma.tag.findMany({
    orderBy: { createdAt: "desc" },
  });
  return tags;
}

// タグ新規作成
export async function createTag({ title }: { title: string }) {
  // タイトルの重複チェック
  const exists = await prisma.tag.findUnique({ where: { title } });
  if (exists) throw new Error("同じタイトルのタグが既に存在します");

  const tag = await prisma.tag.create({
    data: { title },
  });
  return tag;
}

// タグ削除
export async function deleteTag({ id }: { id: string }) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new Error("タグが見つかりません");

  // システムタグは削除不可
  if (tag.isSystemTag) {
    throw new Error("システムタグは削除できません");
  }

  await prisma.tag.delete({ where: { id } });
  return tag;
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

