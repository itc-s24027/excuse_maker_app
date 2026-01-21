import prisma from "../db/prismaClient.js";
import { Prisma } from "@prisma/client";

// 【切り替えスイッチ】テスト中は上のモックを使い、本番は下の本物をインポートする
import { generateExcuseMock as generateExcuse } from "./excuse/generateExcuse.mock.js";
// import { generateExcuse } from "./geminiService.js";

// チャット作成用入力型
type CreateInput = {
    userId: string;
    title: string;
    situation: string;
    tags: string[];
};

// チャット作成
export async function createChat(input: CreateInput) {
    // 1. 言い訳を生成（モックまたは本物）
    const result = await generateExcuse(input.situation);

    // 2. トランザクションで保存
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const chat = await tx.chat.create({
            data: {
                userId: input.userId,
                title: input.title || input.situation.substring(0, 30),
            },
        });

        // タグの保存
        const excuse = await tx.excuse.create({
            data: {
                chatId: chat.id,
                situation: input.situation,
                excuseText: result.text,
            },
        });

        return { chat, excuse };
    });
}

// ユーザーのチャット一覧取得
export async function getChatsByUser(userId: string) {
    return prisma.chat.findMany({
        where: { userId, isDelete: false },
        include: { excuse: true },
        orderBy: { createdAt: "desc" },
    });
}

// チャット詳細取得
export async function getChatDetail(chatId: string) {
    return prisma.chat.findUnique({
        where: { id: chatId },
        include: { excuse: true },
    });
}

// 評価更新
export async function updateEvaluation(params: { chatId: string; userId: string; success: boolean | null }) {
    const excuse = await prisma.excuse.findFirst({ where: { chatId: params.chatId } });
    if (!excuse) throw new Error("回答が見つかりません");

    return await prisma.excuse.update({
        where: { id: excuse.id },
        data: { success: params.success },
    });
}

// チャット削除（論理削除）
export async function deleteChat(params: { chatId: string; userId: string }) {
    await prisma.chat.update({
        where: { id: params.chatId },
        data: { isDelete: true }
    });
}