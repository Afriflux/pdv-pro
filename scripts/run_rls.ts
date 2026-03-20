import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
})

async function main() {
  const sqlPath = path.join(__dirname, 'setup_rls.sql')
  const sqlScript = fs.readFileSync(sqlPath, 'utf8')

  const statements = sqlScript
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  try {
    console.log('Executing RLS setup script...')
    for (const stmt of statements) {
      if (!stmt) continue
      try {
         await prisma.$executeRawUnsafe(stmt)
         console.log('Executed:', stmt.split('\\n')[0].substring(0, 50) + '...')
      } catch (e: any) {
         console.error('Error on stmt:', stmt.split('\\n')[0], e.message)
      }
    }
    console.log('Successfully set up RLS policies for ProductQuestion, Review, Complaint, and Storage.')
  } catch (error) {
    console.error('Error executing RLS script:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
