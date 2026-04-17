import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articleId = 'cmmxwcnkj0002k8u2w8vvf4bd';
  const article = await prisma.warRoomArticle.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    console.log('Article not found');
    return;
  }

  console.log(JSON.stringify(article, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
