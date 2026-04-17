import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const articles = await prisma.warRoomArticle.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      titleEn: true,
      status: true,
      publishedAt: true,
      createdAt: true
    }
  })

  console.log('--- LAST 5 ARTICLES ---')
  articles.forEach(a => {
    console.log(`ID: ${a.id}`)
    console.log(`Title: ${a.titleEn}`)
    console.log(`Status: ${a.status}`)
    console.log(`PublishedAt: ${a.publishedAt}`)
    console.log(`CreatedAt: ${a.createdAt}`)
    console.log('---')
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
