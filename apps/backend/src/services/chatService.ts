// ビジネスロジック・DB トランザクション

import prisma from "../db/prismaClient.js";
import geminiService from "./geminiService.js";
import {Prisma} from "@prisma/client/extension";

// チャット作成用入力型
type CreateInput = {
    userId: string;
    title?: string;
    situation: string;
    target?: string;
    tags?: string[];
};

// チャット作成
export async function createChat(input: CreateInput) {
    // Gemini API で言い訳テキストを生成
    const excuseText = await geminiService.generateExcuseWithRetry(input.situation); // リトライ対応も含む

    // トランザクションで Chat、Excuse、Tag、ExcuseTag をまとめて作成
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Chat 作成
        const chat = await tx.chat.create({
            data: {
                userId: input.userId,
                title: input.title,
            },
        });
        // Excuse 作成
        const excuse = await tx.excuse.create({
            data: {
                chatId: chat.id,
                situation: input.situation,
                excuseText,
            },
        });
        // Tag と ExcuseTag 作成
        if (input.tags && input.tags.length > 0) {
            for (const t of input.tags) {
                const tag = await tx.tag.upsert({ // upsert: 既存なら取得、なければ作成 の流れをやってくれる
                    where: { title: t },    // タイトル(タグ名)が既存か確認
                    update: {},             // 既存の場合は何もしない
                    create: { title: t },   // 新規作成
                });
                // ExcuseTag 作成
                await tx.excuseTag.create({
                    data: { excuseId: excuse.id, tagId: tag.id },
                });
            }
        }
        return { chat, excuse };
    });
    return result;
}

// ユーザーのチャット一覧取得
export async function getChatsByUser(userId: string) {
    return prisma.chat.findMany({           // findMany: 条件に合うデータを全部（あるいは複数）取ってくる
        where: { userId, isDelete: false }, // 論理削除されていないもののみ
        include: { excuse: true },          // excuse も含めて取得
        orderBy: { createdAt: "desc" },     // 作成日時降順
    });
}

// チャット詳細取得
export async function getChatDetail(chatId: string) {
    return prisma.chat.findUnique({ // findUnique: 主キーなど一意な条件で1件だけ取ってくる
        where: {id: chatId},        // チャットIDで検索
        include: { excuse: {                    // excuse 取得
                include: { tag: {               // excuse_tag 取得
                        include: { tag: true    // tag 取得
                        }
                    }
                }
            }
        },
    });
}

// チャット評価更新
export async function updateEvaluation(params: { chatId: string; userId: string; success: boolean | null; details?: string }) {
    // 権限チェック: 投稿者のみ更新可能（例）
    const chat = await prisma.chat.findUnique({ where: { id: params.chatId } }); // チャット取得
    if (!chat) throw new Error("チャットが見つかりません");
    if (chat.userId !== params.userId) throw new Error("アクセス権限が許可されていません");

    // excuse レコード取得
    const excuse = await prisma.excuse.findFirst({ where: { chatId: params.chatId } });
    if (!excuse) throw new Error("excuse not found");

    // 更新
    const updated = await prisma.excuse.update({
        where: { id: excuse.id },
        data: { success: params.success, excuseText: excuse.excuseText, /* details field may be added to schema */ },
    });

    // success が null でない場合、チャットを共有済みに更新
    if (params.success !== null) {
        await prisma.chat.update({ where: { id: params.chatId }, data: { isShared: true } });
    }
    return updated;
}

// チャット削除（論理削除）
export async function deleteChat(params: { chatId: string; userId: string }) {
    const chat = await prisma.chat.findUnique({ where: { id: params.chatId } });
    if (!chat) throw new Error("not found");
    if (chat.userId !== params.userId) throw new Error("not authorized");

    // 論理削除フラグを立てる
    await prisma.chat.update({ where: { id: params.chatId }, data: { isDelete: true } });
}

