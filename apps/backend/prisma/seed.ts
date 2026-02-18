import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial system tags...");

  // システムタグを3つ登録
  const systemTags = [
    { title: "遅刻", isSystemTag: true },
    { title: "学校", isSystemTag: true },
    { title: "仕事", isSystemTag: true },
  ];

  for (const tagData of systemTags) {
    try {
      const tag = await prisma.tag.upsert({
        where: { title: tagData.title },
        update: {},
        create: tagData,
      });
      console.log(`✓ Created/Updated tag: ${tag.title}`);
    } catch (err) {
      console.error(`✗ Failed to create tag ${tagData.title}:`, err);
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

