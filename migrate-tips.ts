import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateTips() {
  console.log('🔄 Début de la migration des Tips vers MasterclassArticle...')
  
  const tips = await prisma.tip.findMany({
    where: { 
      type: 'guide',
      active: true
    }
  })

  console.log(`Found ${tips.length} Tips (guides) to migrate.`)

  let migratedCount = 0;

  for (const tip of tips) {
    // Check if a masterclass with the same title already exists
    const exists = await prisma.masterclassArticle.findFirst({
      where: { title: tip.title }
    })

    if (!exists) {
      await prisma.masterclassArticle.create({
        data: {
          title: tip.title,
          intro: tip.content.substring(0, 200) + '...', // We use content as intro
          category: 'Tips & Guides',
          color: 'bg-indigo-50',
          emoji: '💡',
          readTime: '3 min',
          is_active: tip.active,
          is_premium: tip.target_plan === 'pro',
          price: tip.target_plan === 'pro' ? 2500 : 0,
          tips: [
            {
              number: 1,
              title: tip.title,
              desc: tip.content
            }
          ],
          allowed_roles: ['all'],
          created_at: tip.created_at
        }
      })
      migratedCount++;
    }
  }

  console.log(`✅ ${migratedCount} Tips ont été migrés avec succès vers la Masterclass!`)
}

migrateTips().catch(console.error).finally(() => prisma.$disconnect())
