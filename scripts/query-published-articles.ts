import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    take: 5,
    select: {
      id: true,
      slug: true,
      published: true,
      createdAt: true,
      translations: {
        select: {
          lang: true,
          title: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log(JSON.stringify(articles, null, 2))
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
