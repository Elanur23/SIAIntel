import { prisma } from '../lib/warroom/database';

async function check() {
  const article = await prisma.warRoomArticle.findFirst({
    where: { titleEn: { contains: 'AURORA' } },
    orderBy: { createdAt: 'desc' }
  });

  if (article) {
    console.log(`AURORA_SYNC_STATUS: SUCCESS`);
    console.log(`ID: ${article.id}`);
    console.log(`Published At: ${article.publishedAt}`);
  } else {
    console.log(`AURORA_SYNC_STATUS: NOT_FOUND`);
  }
}

check();
