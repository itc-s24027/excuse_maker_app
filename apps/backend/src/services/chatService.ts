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
            isDeleted: false, // 削除されていないチャットのみを取得
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
            isDeleted: false, // 削除されていないチャットのみを取得
        },
        include: {
            excuses: {
                include: {
                    tags: true, // タグ情報を含める
                },
            },
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
 * 言い訳（excuse）の非表示フラグを更新する
 * input: { excuseId, isDeleted }
 */
export async function updateExcuseVisibility({ excuseId, isDeleted }: { excuseId: string; isDeleted: boolean }) {
    const updated = await prisma.excuse.update({
        where: { id: excuseId },
        data: { isDeleted },
    });
    return updated;
}

/**
 * チャットのタイトルを更新
 */
export async function updateChatTitle({ chatId, userUid, title }: { chatId: string; userUid: string; title: string }) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId }, include: { user: true } });
    if (!chat) throw new Error("Chat not found");
    // user relation からユーザー識別子を確認
    if ((chat.user as any)?.uid && (chat.user as any).uid !== userUid) {
        throw new Error("Forbidden");
    }
    const updated = await prisma.chat.update({
        where: { id: chatId },
        data: { title },
    });
    return updated;
}

/**
 * チャット削除（論理削除：isDeletedフラグをtrueに設定）
 * 関連する言い訳も論理削除する
 */
export async function deleteChat({ chatId, userUid }: { chatId: string; userUid: string }) {
    return prisma.$transaction(async (tx) => {
        const chat = await tx.chat.findUnique({ where: { id: chatId }, include: { user: true } });
        if (!chat) throw new Error("Chat not found");
        // user relation からユーザー識別子を確認
        if ((chat.user as any)?.uid && (chat.user as any).uid !== userUid) {
            throw new Error("Forbidden");
        }

        // チャットに関連する言い訳を論理削除
        await tx.excuse.updateMany({
            where: { chatId: chatId },
            data: { isDeleted: true },
        });

        // チャットを論理削除
        await tx.chat.update({
            where: { id: chatId },
            data: { isDeleted: true },
        });
    });
}

/**
 * 言い訳を保存（複数タグ付き）
 * 既存の言い訳にタグを関連付ける
 */
export async function saveExcuse({
  chatId,
  excuseId,
  tagIds,
}: {
  chatId: string;
  excuseId: string;
  tagIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    // 言い訳が存在するか確認
    const excuse = await tx.excuse.findUnique({
      where: { id: excuseId },
    });

    if (!excuse) {
      throw new Error("Excuse not found");
    }

    if (excuse.chatId !== chatId) {
      throw new Error("Excuse does not belong to this chat");
    }

    // タグを関連付け（複数）
    if (tagIds && tagIds.length > 0) {
      // 既存のタグ関連を取得
      const existingTags = await tx.excuseTag.findMany({
        where: {
          excuseId: excuse.id,
        },
        select: {
          tagId: true,
        },
      });

      const existingTagIds = new Set(existingTags.map(t => t.tagId));

      // 新しいタグのみをフィルター
      const newTagIds = tagIds.filter(tagId => !existingTagIds.has(tagId));

      // 新しいタグのみを追加（skipDuplicatesで重複を自動スキップ）
      if (newTagIds.length > 0) {
        await tx.excuseTag.createMany({
          data: newTagIds.map((tagId) => ({
            excuseId: excuse.id,
            tagId,
          })),
          skipDuplicates: true, // 重複する場合はスキップ
        });
      }
    }

    return { excuse };
  });
}

/**
 * いいねを追加
 */
export async function addLike({
  excuseId,
  userUid,
}: {
  excuseId: string;
  userUid: string;
}) {
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
export async function removeLike({
  excuseId,
  userUid,
}: {
  excuseId: string;
  userUid: string;
}) {
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
export async function getLikeInfo({
  excuseId,
  userUid,
}: {
  excuseId: string;
  userUid: string | undefined;
}) {
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
